from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.auth_service import get_current_active_user
from core.database import get_db
from models.user.models import User, UserPreference
from db.dashboard.schemas import OnboardingData
from services.embeddings import embed_query

router = APIRouter()


@router.post("/onboarding")
def onboarding(
    data: OnboardingData,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if pref:
        pref.budget = data.budget
        pref.interests = data.interests
        pref.preferred_pace = data.pace
        pref.travel_style = data.travelStyle
    else:
        embedding = embed_query(
            f"Budget: {data.budget}, Interests: {data.interests}, Pace: {data.pace}, Travel Style: {data.travelStyle}"
        )

        pref = UserPreference(
            user_id=user.id,
            budget=data.budget,
            interests=data.interests,
            preferred_pace=data.pace,
            travel_style=data.travelStyle,
            embedding=embedding,
        )
        db.add(pref)
    db.commit()
    return {"success": True}
