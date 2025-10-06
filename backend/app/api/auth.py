from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.core.security import create_access_token
from app.modules.users.schemas import Token
from app.modules.users.services import UserService


class LoginRequest(BaseModel):
    login: str
    password: str


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    service = UserService()
    user = service.authenticate(
        db,
        login=payload.login,
        password=payload.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(
        user.id,
        {"role": user.role, "full_name": user.full_name},
    )
    return Token(access_token=token)
