import re
import sys
import json
import psycopg
import requests
from sentence_transformers import SentenceTransformer
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from core.config import Settings
from db.itinerary.schemas import ItineraryRequest

# =========================
# CONFIG
# =========================
settings = Settings()
print("OLLAMA_URL:", settings.OLLAMA_URL)
print("DATABASE_URL:", settings.DATABASE_URL)
DATABASE_URL = settings.DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

MODEL_NAME = settings.MODEL_NAME
if not MODEL_NAME:
    raise ValueError("MODEL_NAME is not set in .env")

OLLAMA_URL = settings.OLLAMA_URL
if not OLLAMA_URL:
    raise ValueError("OLLAMA_URL is not set in .env")

OLLAMA_MODEL = settings.OLLAMA_MODEL
if not OLLAMA_MODEL:
    raise ValueError("OLLAMA_MODEL is not set in .env")

# =========================
# INIT
# =========================
model = SentenceTransformer(MODEL_NAME)


# =========================
# HELPERS
# =========================
def embed_query(query: str):
    text = "Represent this sentence for searching relevant places: " + query
    embedding = model.encode([text], normalize_embeddings=True)[0]
    return embedding.tolist()


def vector_to_pg(v):
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"


def fetch_places(query_vector, limit=15):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, category, description, imageUrl,
                       embedding <=> %s::vector AS distance
                FROM "places"
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
                """,
                (query_vector, query_vector, limit),
            )
            rows = cur.fetchall()

    places = []
    for r in rows:
        places.append(
            {
                "id": r[0],
                "name": r[1],
                "category": r[2],
                "description": r[3],
                "imageurl": r[4],
                "distance": float(r[5]),
            }
        )

    return places


def format_places_for_llm(places):
    formatted = []
    for i, p in enumerate(places):
        formatted.append(f"""
[{i + 1}] {p["name"]}
Category: {p["category"]}
Description: {p["description"] or "No description"}
Image URL: {p["imageurl"] or ""}
""")
    return "\n".join(formatted)


def build_prompt(query, places_text):
    return f"""
You are a travel planner.

User request:
"{query}"

Using ONLY the places provided below, create a travel itinerary.

Places:
{places_text}

FOLLOW THESE RULES STRICTLY:
- Only use places from the list above
- Do NOT invent places
- Organize by day
- Make the plan REALISTIC (distance, time, flow)
- For each place, use the provided Image URL for the "image" field in the output.
- Include places for breakfast, lunch, dinner, and activities if possible.

FOLLOW THE EXAMPLE FORMAT BELOW, you can add as many time and places as you want as long as it is appropriate:

{{
  "itinerary": [
    {{
      "day": 1,
      "sections": [
        {{
          "time": "...",
          "places": [
            {{
              "name": "...",
              "description": "...",
              "image": "https://example.com/image.jpg"
            }}
          ]
        }},
        {{
          "time": "...",
          "places": [
            {{
              "name": "...",
              "description": "...",
              "image": "https://example.com/image.jpg"
            }}
          ]
        }}
      ]
    }},
    {{
      "day": 2,
      "sections": [
        {{
          "time": "...",
          "places": [
            {{
              "name": "...",
              "description": "...",
              "image": "https://example.com/image.jpg"
            }}
          ]
        }}
      ]
    }}
  ]
}}
"""


def call_ollama(prompt):
    res = requests.post(
        OLLAMA_URL, json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    )

    data = res.json()
    return data.get("response", "")


def parse_itinerary(raw: str):
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    json_str = raw[start : end + 1]

    json_str = re.sub(r"\[.*?\]", '""', json_str)
    json_str = re.sub(r'""\s*\([^)]*\)', '""', json_str)
    json_str = re.sub(r'(description:.*?")\s*("image")', r"\1,\2", json_str)
    json_str = re.sub(r"([,{]\s*)(\w+):", r'\1"\2":', json_str)
    json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)
    json_str = re.sub(r",(\s*[}\]])", r"\1", json_str)

    print("--- JSON TO PARSE ---")
    print(json_str)
    print("---------------------")

    try:
        return json.loads(json_str)
    except Exception as e:
        print("Failed to parse itinerary:", e)
        return None


# =========================
# FASTAPI ROUTE
# =========================

router = APIRouter()


@router.post("/itinerary")
async def generate_itinerary(request: ItineraryRequest):
    print("[Itinerary] Received request")
    query = request.query
    limit = request.limit

    print("[Itinerary] Step 1: Embedding query")
    embedding = embed_query(query)
    pg_vector = vector_to_pg(embedding)

    print("[Itinerary] Step 2: Fetching places")
    places = fetch_places(pg_vector, limit=limit)

    if not places:
        print("[Itinerary] No places found, returning 404")
        raise HTTPException(status_code=404, detail="No places found")

    print(f"[Itinerary] Step 3: Formatting {len(places)} places for LLM")
    places_text = format_places_for_llm(places)

    print("[Itinerary] Step 4: Building prompt")
    prompt = build_prompt(query, places_text)

    print("[Itinerary] Step 5: Calling LLM (Ollama)")
    llm_output = call_ollama(prompt)

    print("[Itinerary] Step 6: LLM raw output:")
    print(llm_output)

    print("[Itinerary] Step 7: Cleaning and parsing LLM result")
    parsed = parse_itinerary(llm_output)
    if parsed and "itinerary" in parsed:
        parsed = parsed["itinerary"]

    print("[Itinerary] Step 8: Returning parsed itinerary")
    return JSONResponse(content={"itinerary": parsed})
