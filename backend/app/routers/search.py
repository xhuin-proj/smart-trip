from fastapi import APIRouter, Depends
from db.itinerary.schemas import SearchRequest, SearchResponse, PlaceResult, IntentInfo
from services.embeddings import embed_query
from services.intent import parse_intent
from core.database import get_db
from sqlalchemy import text

router = APIRouter()


def vector_to_pg(v: list[float]) -> str:
    return "[" + ",".join(f"{x:.8f}" for x in v) + "]"


def compute_preference_score(place, user_preferences):
    # Example: match interests
    place_tags = set(place["tags"])
    user_interests = set(user_preferences.get("interests", []))
    if not user_interests:
        return 0.5  # neutral if no preferences
    matches = place_tags & user_interests
    return len(matches) / len(user_interests)


@router.post("/search", response_model=SearchResponse)
def search(body: SearchRequest, db=Depends(get_db)) -> SearchResponse:
    intent = parse_intent(body.query)

    embedding = embed_query(body.query)
    pg_vector = vector_to_pg(embedding)

    # Build optional WHERE clauses from parsed intent
    filters: list[str] = ["embedding IS NOT NULL"]
    sql_params = {}

    # Build the placeholders for the IN clause
    if body.use_intent_filter and intent.categories:
        filters.append("category IN :categories")
        sql_params["categories"] = tuple(intent.categories)

    if body.use_intent_filter and intent.budget_level is not None:
        if intent.budget_level == 1:
            filters.append('"budgetlevel" <= 1')
        elif intent.budget_level == 3:
            filters.append('"budgetlevel" >= 3')

    where_clause = " AND ".join(filters)

    # Fetch more rows when filtering so we still return body.limit results
    fetch_limit = (
        body.limit * 3 if (intent.categories or intent.budget_level) else body.limit
    )

    sql = text(f"""
        SELECT id, name, category,
            description, imageurl, budgetlevel,
            embedding <=> :pg_vector AS distance
        FROM "places"
        WHERE {where_clause}
        ORDER BY embedding <=> :pg_vector
        LIMIT :fetch_limit
    """)
    sql_params["pg_vector"] = pg_vector
    sql_params["fetch_limit"] = fetch_limit
    rows = db.execute(sql, sql_params).fetchall()

    results = [
        PlaceResult(
            id=row[0],
            name=row[1],
            category=row[2],
            description=row[3],
            image_url=row[4],
            budget_level=row[5],
            distance=float(row[6]),
            final_score=None,  # Set to None or compute if available
        )
        for row in rows
    ][: body.limit]

    return SearchResponse(
        results=results,
        intent=IntentInfo(
            categories=intent.categories,
            budget_level=intent.budget_level,
            outdoor=intent.outdoor,
        ),
    )
