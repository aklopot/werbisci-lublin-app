from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_admin
from .models import User
from .repositories import UserRepository
from .schemas import UserCreate, UserRead, UserUpdateRole
from app.core.security import hash_password

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> List[User]:
    repo = UserRepository()
    return repo.list(db)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    repo = UserRepository()
    if repo.get_by_login(db, payload.login):
        raise HTTPException(status_code=400, detail="Login already exists")
    user = repo.create(
        db,
        full_name=payload.full_name,
        login=payload.login,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    return user


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: int,
    payload: UserUpdateRole,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    repo = UserRepository()
    user = repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = repo.set_role(db, user, payload.role)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Response:
    repo = UserRepository()
    repo.delete(db, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
