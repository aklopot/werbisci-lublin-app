from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from .models import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    login: str = Field(min_length=3, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.user


class UserRead(BaseModel):
    id: int
    full_name: str
    login: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    login: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: UserRole | None = None


class UserUpdateRole(BaseModel):
    role: UserRole
