from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import Base, engine, SessionLocal
from app.modules.users.services import UserService
from app.api.auth import router as auth_router
from app.modules.users.api import router as users_router
from app.modules.addresses.api import router as addresses_router
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
app.include_router(printing_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.on_event("startup")
def startup_event() -> None:
    # Bootstrap admin user if missing
    db: Session = SessionLocal()
    try:
        UserService().ensure_admin_exists(db)
    finally:
        db.close()
