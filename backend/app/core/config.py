from __future__ import annotations

import os
from functools import lru_cache
from typing import List


class Settings:
    def __init__(self) -> None:
        # Security/JWT
        self.jwt_secret: str = os.environ.get("JWT_SECRET", "change-me-in-env")
        self.jwt_algorithm: str = os.environ.get("JWT_ALGORITHM", "HS256")
        # default to 24h
        self.jwt_expires_minutes: int = int(
            os.environ.get("JWT_EXPIRES_MINUTES", "1440")
        )

        # Admin bootstrap
        self.admin_login: str | None = os.environ.get("ADMIN_LOGIN")
        self.admin_email: str | None = os.environ.get("ADMIN_EMAIL")
        self.admin_password: str | None = os.environ.get("ADMIN_PASSWORD")

        # Database
        # Default to repo-relative path (resolved in db.py)
        # Containers may override: SQLITE_DB_PATH=/data/werbisci-app.db
        self.sqlite_db_path: str = os.environ.get(
            "SQLITE_DB_PATH", "data/werbisci-app.db"
        )

        # CORS
        cors_env: str = os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000",
        )
        self.cors_origins: List[str] = [
            origin.strip()
            for origin in cors_env.split(",")
            if origin.strip()
        ]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
