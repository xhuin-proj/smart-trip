from typing import Annotated
import jwt
from models.auth.models import TokenData
from utils.auth_utils import verify_password
from core.config_loader import settings
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from core.database import get_db
from models.user.models import User
from services.user_services import get_user_by_username

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
AUTH_TOKEN_EXPIRY_MIN = settings.AUTH_TOKEN_EXPIRY_MIN

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def authenticate_user(username: str, password: str, db: Session = Depends(get_db)):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=AUTH_TOKEN_EXPIRY_MIN)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user
