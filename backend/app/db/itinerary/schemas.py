from uuid import UUID
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(12, ge=1, le=50)
    use_intent_filter: bool = Field(True)


class IntentInfo(BaseModel):
    categories: list[str]
    budget_level: int | None
    outdoor: bool | None


class PlaceResult(BaseModel):
    id: UUID
    name: str
    category: str
    description: str | None
    image_url: str | None
    budget_level: int | None
    distance: float
    final_score: float | None


class SearchResponse(BaseModel):
    results: list[PlaceResult]
    intent: IntentInfo | None = None


class ItineraryRequest(BaseModel):
    query: str
    limit: int = 15
