from __future__ import annotations
from typing import List
from sqlalchemy.orm import Session

from .models import LoginSession
from .repositories import LoginSessionRepository


class LoginSessionService:
    def __init__(self):
        self.repo = LoginSessionRepository()

    def create_session(
        self,
        db: Session,
        *,
        user_id: int,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> LoginSession:
        return self.repo.create(
            db,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def logout_session(
        self,
        db: Session,
        session_id: int,
        *,
        logout_reason: str,
    ) -> LoginSession | None:
        session = self.repo.get_by_id(db, session_id)
        if not session:
            return None
        return self.repo.update_logout(db, session, logout_reason=logout_reason)

    def list_sessions(
        self,
        db: Session,
        *,
        limit: int = 50,
        offset: int = 0,
        sort_field: str = "login_time",
        sort_direction: str = "desc",
    ) -> List[LoginSession]:
        return self.repo.list(
            db,
            limit=limit,
            offset=offset,
            sort_field=sort_field,
            sort_direction=sort_direction,
        )

    def search_sessions(
        self,
        db: Session,
        *,
        user_id: int | None = None,
        active_only: bool = False,
        q: str | None = None,
        limit: int = 50,
        offset: int = 0,
        sort_field: str = "login_time",
        sort_direction: str = "desc",
    ) -> List[LoginSession]:
        return self.repo.search(
            db,
            user_id=user_id,
            active_only=active_only,
            q=q,
            limit=limit,
            offset=offset,
            sort_field=sort_field,
            sort_direction=sort_direction,
        )

    def count_active_sessions(self, db: Session) -> int:
        return self.repo.count_active_sessions(db)

