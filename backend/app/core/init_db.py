from __future__ import annotations

from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .db import Base, engine, SessionLocal
from app.modules.users.models import User, UserRole
from app.modules.users.repositories import UserRepository
from app.core.security import hash_password
from app.modules.addresses.models import Address
from app.modules.login_sessions.models import LoginSession


def _seed_admin(db: Session) -> None:
    repo = UserRepository()
    existing = repo.get_by_login(db, "admin")
    if existing:
        return
    repo.create(
        db,
        full_name="Administrator",
        login="admin",
        email="admin@example.com",
        password_hash=hash_password("admin"),
        role=UserRole.admin,
    )


def _seed_addresses(db: Session) -> None:
    any_address = db.scalar(select(Address.id).limit(1))
    if any_address is not None:
        return
    examples: List[Address] = [
        Address(
            first_name="Jan",
            last_name="Kowalski",
            street="Lipowa 10",
            apartment_no="5",
            city="Lublin",
            postal_code="20-001",
            label_marked=False,
        ),
        Address(
            first_name="Anna",
            last_name="Nowak",
            street="Krakowskie Przedmieście 12",
            apartment_no=None,
            city="Lublin",
            postal_code="20-002",
            label_marked=False,
        ),
        Address(
            first_name="Piotr",
            last_name="Zieliński",
            street="Narutowicza 3",
            apartment_no="7A",
            city="Lublin",
            postal_code="20-003",
            label_marked=True,
        ),
    ]
    db.add_all(examples)
    db.commit()


def main() -> None:
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed data idempotently
    db: Session = SessionLocal()
    try:
        _seed_admin(db)
        _seed_addresses(db)
        # Print brief summary
        users_count = db.scalar(select(func.count()).select_from(User))
        addresses_count = db.scalar(select(func.count()).select_from(Address))
        sessions_count = db.scalar(select(func.count()).select_from(LoginSession))
        msg_users = users_count if users_count is not None else "?"
        msg_addresses = addresses_count if addresses_count is not None else "?"
        msg_sessions = sessions_count if sessions_count is not None else "?"
        print(
            f"Initialized DB. Users: {msg_users}; Addresses: {msg_addresses}; Login Sessions: {msg_sessions}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
