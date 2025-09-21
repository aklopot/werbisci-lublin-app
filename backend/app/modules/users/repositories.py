from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.orm import Session
from .models import User, UserRole


class UserRepository:
    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.get(User, user_id)

    def get_by_login(self, db: Session, login: str) -> Optional[User]:
        stmt = select(User).where(User.login == login)
        return db.scalar(stmt)

    def list(self, db: Session) -> List[User]:
        stmt = select(User).order_by(User.id.asc())
        return list(db.scalars(stmt).all())

    def create(
        self,
        db: Session,
        *,
        full_name: str,
        login: str,
        email: str,
        password_hash: str,
        role: UserRole,
    ) -> User:
        user = User(
            full_name=full_name,
            login=login,
            email=email,
            password_hash=password_hash,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def set_role(self, db: Session, user: User, role: UserRole) -> User:
        user.role = role
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def delete(self, db: Session, user_id: int) -> None:
        stmt = delete(User).where(User.id == user_id)
        db.execute(stmt)
        db.commit()
