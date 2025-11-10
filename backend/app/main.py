import json
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import Base, engine, SessionLocal
from app.modules.users.services import UserService
from app.api.auth import router as auth_router
from app.modules.users.api import router as users_router
from app.modules.addresses.api import router as addresses_router
from app.modules.login_sessions.api import router as login_sessions_router
from app.modules.printing.api import router as printing_router

app = FastAPI()

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB init
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(addresses_router)
app.include_router(login_sessions_router)
app.include_router(printing_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/version")
def get_version() -> dict:
    """
    Get application version information.
    Returns version from version.json file if exists, otherwise from environment variables.
    """
    version_file = Path(__file__).parent / "version.json"
    
    # Try to read from version.json file
    if version_file.exists():
        try:
            with open(version_file, "r") as f:
                return json.load(f)
        except Exception:
            pass
    
    # Fallback to environment variables
    return {
        "version": os.getenv("APP_VERSION", "dev"),
        "buildDate": os.getenv("APP_BUILD_DATE", "unknown")
    }


@app.on_event("startup")
def startup_event() -> None:
    """
    Initialize database and ensure admin user exists on startup.
    This runs every time the application starts.
    """
    # Create all tables if they don't exist
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Bootstrap admin user if missing
    db: Session = SessionLocal()
    try:
        print("Ensuring admin user exists...")
        admin = UserService().ensure_admin_exists(db)
        if admin:
            print(f"Admin user ready: {admin.login}")
    except Exception as e:
        print(f"Error during startup: {e}")
    finally:
        db.close()
