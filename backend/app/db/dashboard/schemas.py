from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional


class OnboardingData(BaseModel):
    budget: str
    interests: List[str]
    pace: str
    travelStyle: str


class Place(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    category: str
    budgetLevel: int | None = None
    imageurl: str | None = None
    embedding: Optional[List[float]] = None

    class Config:
        from_attributes = True
