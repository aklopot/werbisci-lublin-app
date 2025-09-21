from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


def _build_sqlite_url() -> str:
    settings = get_settings()
    raw_db_path = settings.sqlite_db_path
    # On Windows, a POSIX-style absolute path like "/data/x.db" is treated
    # as drive-absolute. Normalize to relative so local runs use repo DB,
    # while containers (posix) keep /data/...
    is_posix_abs = (
        raw_db_path.startswith("/") and not raw_db_path.startswith("//")
    )
    if os.name == "nt" and is_posix_abs:
        raw_db_path = raw_db_path.lstrip("/")

    db_path = raw_db_path
    # If not absolute, resolve path relative to backend root dir
    if not os.path.isabs(db_path):
        # __file__ is backend/app/core/db.py → up 2 levels to reach backend/
        backend_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..")
        )
        db_path = os.path.normpath(os.path.join(backend_root, db_path))
    parent_dir = os.path.dirname(db_path)
    if parent_dir and not os.path.exists(parent_dir):
        os.makedirs(parent_dir, exist_ok=True)
    return f"sqlite+pysqlite:///{db_path}"


engine = create_engine(
    _build_sqlite_url(),
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
