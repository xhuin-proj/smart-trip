import os
import json
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import psycopg

MODEL_NAME = "BAAI/bge-base-en-v1.5"

model = SentenceTransformer(MODEL_NAME)


def place_to_text(place: dict) -> str:
    parts = [
        f"Name: {place['name']}",
        f"Category: {place['category']}",
    ]

    if place.get("description"):
        parts.append(f"Description: {place['description']}")

    return "\n".join(parts)


def vector_to_pg(v):
    # pgvector accepts string format like [0.1,0.2,...]
    return "[" + ",".join(f"{x:.8f}" for x in v) + "]"


def embed_json_places(json_path=None, output_path=None):
    if json_path is None:
        json_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "new-places.json"
        )
    if output_path is None:
        output_path = json_path
    with open(json_path, "r", encoding="utf-8") as f:
        places = json.load(f)
    texts = [place_to_text(place) for place in places]
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=True,
    )
    for place, embedding in zip(places, embeddings):
        place["embedding"] = (
            "[" + ",".join(f"{x:.8f}" for x in embedding.tolist()) + "]"
        )
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    print(f"Embedded {len(places)} places in {output_path}")


def main():
    embed_json_places()
    return


if __name__ == "__main__":
    main()
