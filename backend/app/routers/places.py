from fastapi import APIRouter, HTTPException, Query, Depends
from huggingface_hub import User
from sqlalchemy.orm import Session
from models.user.models import UserPreference
from services.auth_service import get_current_active_user
from core.database import get_db
from models.place.models import Place
from db.dashboard.schemas import Place as PlaceSchema

router = APIRouter()


@router.get("/recommend")
def recommend_places(
    skip: int = Query(0, ge=0),
    take: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    # Get user embedding
    pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if not pref or pref.embedding is None:
        raise HTTPException(status_code=404, detail="User embedding not found")

    # Query places ordered by vector similarity
    places = (
        db.query(Place)
        .order_by(Place.embedding.l2_distance(pref.embedding))
        .offset(skip)
        .limit(take)
        .all()
    )
    return [PlaceSchema.from_orm(place) for place in places]
