from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.deps import get_db, require_admin
from .models import LoginSession
from .repositories import LoginSessionRepository
from .schemas import LoginSessionRead
from .services import LoginSessionService

router = APIRouter(prefix="/api/login-sessions", tags=["login-sessions"])


@router.get("", response_model=List[LoginSessionRead])
def list_login_sessions(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sort_field: str = Query(default="login_time"),
    sort_direction: str = Query(default="desc"),
) -> List[LoginSession]:
    service = LoginSessionService()
    return service.list_sessions(
        db,
        limit=limit,
        offset=offset,
        sort_field=sort_field,
        sort_direction=sort_direction,
    )


@router.get("/search", response_model=List[LoginSessionRead])
def search_login_sessions(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
    user_id: int | None = Query(default=None),
    active_only: bool = Query(default=False),
    q: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sort_field: str = Query(default="login_time"),
    sort_direction: str = Query(default="desc"),
) -> List[LoginSession]:
    service = LoginSessionService()
    return service.search_sessions(
        db,
        user_id=user_id,
        active_only=active_only,
        q=q,
        limit=limit,
        offset=offset,
        sort_field=sort_field,
        sort_direction=sort_direction,
    )


@router.get("/active-count")
def get_active_sessions_count(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
) -> dict:
    """Get count of currently active sessions"""
    service = LoginSessionService()
    count = service.count_active_sessions(db)
    return {"active_sessions": count}


@router.delete("/clear-data")
def clear_login_sessions_data(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
) -> dict:
    """Clear all data from login_sessions table. This operation cannot be undone."""
    try:
        # Delete all records from login_sessions table
        db.execute(text("DELETE FROM login_sessions"))
        db.commit()

        return {
            "message": "All login sessions data has been cleared successfully",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing login sessions data: {str(e)}"
        )


@router.post("/recreate-schema", status_code=status.HTTP_200_OK)
def recreate_login_sessions_schema(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
) -> dict:
    """Drop and recreate login_sessions table with clean schema. This operation
    cannot be undone."""
    try:
        # Drop the login_sessions table
        db.execute(text("DROP TABLE IF EXISTS login_sessions"))
        db.commit()

        # Recreate the table using SQLAlchemy metadata
        from app.core.db import Base
        Base.metadata.create_all(bind=db.bind, tables=[LoginSession.__table__])

        return {
            "message": "Login sessions table has been recreated successfully",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recreating login sessions schema: {str(e)}"
        )

