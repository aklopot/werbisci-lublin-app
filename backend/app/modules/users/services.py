from __future__ import annotations
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from .models import User, UserRole
from .repositories import UserRepository


class UserService:
    def __init__(self, repo: Optional[UserRepository] = None) -> None:
        self.repo = repo or UserRepository()

    # Admin bootstrap on startup
    def ensure_admin_exists(self, db: Session) -> Optional[User]:
        settings = get_settings()
        if (
            not settings.admin_login
            or not settings.admin_password
            or not settings.admin_email
        ):
            return None

        existing = self.repo.get_by_login(db, settings.admin_login)
        if existing:
            return existing

        admin = self.repo.create(
            db,
            full_name="Administrator",
            login=settings.admin_login,
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            role=UserRole.admin,
        )
        return admin

    def authenticate(
        self,
        db: Session,
        *,
        login: str,
        password: str,
    ) -> Optional[User]:
        user = self.repo.get_by_login(db, login)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
