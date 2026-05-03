from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta
from typing import Annotated
from models.auth.models import Token
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from services.auth_service import authenticate_user, create_access_token
from db.user.schemas import UserCreate
from services.user_services import create_user, get_user_by_username
from core.database import get_db

auth_router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@auth_router.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
) -> Token:
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=1440)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")


@auth_router.post("/signup", status_code=201)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )
    user = create_user(db, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User could not be created"
        )
    return {"message": "Signup successful"}
