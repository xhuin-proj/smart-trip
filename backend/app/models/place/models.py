from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, String, Text
from core.database import Base


class Place(Base):
    __tablename__ = "places"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    budgetlevel = Column(Integer, nullable=True)
    imageurl = Column(String, nullable=True)
    embedding = Column(Vector(768), nullable=True)
