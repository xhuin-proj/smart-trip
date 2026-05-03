from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import JSON, Column, ForeignKey, Integer, String, DateTime
from core.database import Base
from datetime import datetime, timezone
import uuid
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc), nullable=False
    )
    preferences = relationship("UserPreference", back_populates="user", uselist=False)


class UserPreference(Base):
    __tablename__ = "user_preferences"
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True, unique=True
    )
    budget = Column(String)
    interests = Column(JSON)
    preferred_pace = Column(String)
    travel_style = Column(String)
    user = relationship("User", back_populates="preferences")
    embedding = Column(Vector(768), nullable=True)
