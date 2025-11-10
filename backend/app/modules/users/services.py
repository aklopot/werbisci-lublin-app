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
        """
        Ensure admin user exists in database.
        Creates admin user with default credentials if not found.
        Default: login='admin', password='admin123', email='admin@werbisci.local'
        Override with env vars: ADMIN_LOGIN, ADMIN_PASSWORD, ADMIN_EMAIL
        """
        settings = get_settings()
        
        # Check if admin already exists
        existing = self.repo.get_by_login(db, settings.admin_login)
        if existing:
            return existing

        # Create admin user with settings (defaults or env vars)
        try:
            admin = self.repo.create(
                db,
                full_name="Administrator",
                login=settings.admin_login,
                email=settings.admin_email,
                password_hash=hash_password(settings.admin_password),
                role=UserRole.admin,
            )
            print(f"Created admin user: {settings.admin_login}")
            return admin
        except Exception as e:
            print(f"Warning: Could not create admin user: {e}")
            return None

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
