from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    street: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True
    )
    apartment_no: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    city: Mapped[str] = mapped_column(
        String(120), nullable=False, index=True
    )
    postal_code: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    label_marked: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


__all__ = ["Address"]
