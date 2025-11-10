from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Select, asc, desc, select, delete, or_, func
from sqlalchemy.orm import Session

from .models import LoginSession


class LoginSessionRepository:
    def get_by_id(self, db: Session, session_id: int) -> Optional[LoginSession]:
        stmt: Select[tuple[LoginSession]] = select(LoginSession).where(
            LoginSession.id == session_id
        )
        return db.scalar(stmt)

    def list(
        self,
        db: Session,
        *,
        limit: int = 50,
        offset: int = 0,
        sort_field: str = "login_time",
        sort_direction: str = "desc",
    ) -> List[LoginSession]:
        stmt: Select[tuple[LoginSession]] = select(LoginSession)
        
        # Apply sorting
        if hasattr(LoginSession, sort_field):
            column = getattr(LoginSession, sort_field)
            if sort_direction == "desc":
                stmt = stmt.order_by(desc(column))
            else:
                stmt = stmt.order_by(asc(column))
        else:
            # Default sort
            stmt = stmt.order_by(desc(LoginSession.login_time))
        
        stmt = stmt.limit(limit).offset(offset)
        return list(db.scalars(stmt).all())

    def create(
        self,
        db: Session,
        *,
        user_id: int,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> LoginSession:
        session = LoginSession(
            user_id=user_id,
            login_time=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def update_logout(
        self,
        db: Session,
        session: LoginSession,
        *,
        logout_reason: str,
    ) -> LoginSession:
        session.logout_time = datetime.utcnow()
        session.logout_reason = logout_reason
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def delete(self, db: Session, session_id: int) -> None:
        stmt = delete(LoginSession).where(LoginSession.id == session_id)
        db.execute(stmt)
        db.commit()

    def search(
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
        stmt: Select[tuple[LoginSession]] = select(LoginSession)

        # Filter by user_id if provided
        if user_id is not None:
            stmt = stmt.where(LoginSession.user_id == user_id)

        # Filter active sessions (logout_time is NULL)
        if active_only:
            stmt = stmt.where(LoginSession.logout_time.is_(None))

        # Text search (if needed for future enhancements)
        if q and q.strip():
            search_term = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(
                    LoginSession.ip_address.ilike(search_term),
                    LoginSession.user_agent.ilike(search_term),
                    LoginSession.logout_reason.ilike(search_term),
                )
            )

        # Apply sorting
        if hasattr(LoginSession, sort_field):
            column = getattr(LoginSession, sort_field)
            if sort_direction == "desc":
                stmt = stmt.order_by(desc(column))
            else:
                stmt = stmt.order_by(asc(column))
        else:
            # Default sort
            stmt = stmt.order_by(desc(LoginSession.login_time))

        stmt = stmt.limit(limit).offset(offset)
        return list(db.scalars(stmt).all())

    def count_active_sessions(self, db: Session) -> int:
        """Count currently active sessions (not logged out)"""
        stmt = select(func.count()).select_from(LoginSession).where(
            LoginSession.logout_time.is_(None)
        )
        result = db.scalar(stmt)
        return result if result is not None else 0

