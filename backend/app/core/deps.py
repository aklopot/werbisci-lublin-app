from __future__ import annotations

from typing import Iterable

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .db import SessionLocal
from .security import decode_token
from app.modules.users.models import User, UserRole
from app.modules.users.repositories import UserRepository


http_bearer = HTTPBearer(auto_error=False)


def get_db() -> Iterable[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise ValueError("Missing subject")
        user_id = int(subject)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    repo = UserRepository()
    user = repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def require_manager(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager role required",
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user


# Auth helpers that also accept token passed via query parameter
def get_current_user_qh(
    token: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    # Prefer explicit token param for download links; fall back to
    # Authorization header
    if token:
        try:
            payload = decode_token(token)
            subject = payload.get("sub")
            if subject is None:
                raise ValueError("Missing subject")
            user_id = int(subject)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    else:
        if credentials is None or credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        try:
            payload = decode_token(credentials.credentials)
            subject = payload.get("sub")
            if subject is None:
                raise ValueError("Missing subject")
            user_id = int(subject)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

    repo = UserRepository()
    user = repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_manager_qh(
    current_user: User = Depends(get_current_user_qh),
) -> User:
    if current_user.role not in (
        UserRole.manager,
        UserRole.admin,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager role required",
        )
    return current_user
