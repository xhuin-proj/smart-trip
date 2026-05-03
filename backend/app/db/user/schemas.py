from pydantic import BaseModel


class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str


class UserSchema(UserBase):
    id: int

    class Config:
        from_attributes = True
