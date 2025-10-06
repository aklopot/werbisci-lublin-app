from __future__ import annotations

from typing import List, Optional, Union

from sqlalchemy import Select, and_, delete, or_, select
from sqlalchemy.orm import Session

from .models import Address


class AddressRepository:
    def get_by_id(self, db: Session, address_id: int) -> Optional[Address]:
        return db.get(Address, address_id)

    def list(
        self,
        db: Session,
        *,
        limit: int = 50,
        offset: int = 0,
        sort_field: str = "id",
        sort_direction: str = "asc"
    ) -> List[Address]:
        # Validate sort field
        valid_fields = [
            "id", "first_name", "last_name", "street", "apartment_no",
            "city", "postal_code", "description", "label_marked"
        ]
        if sort_field not in valid_fields:
            sort_field = "id"

        # Get the column to sort by
        sort_column = getattr(Address, sort_field)

        # Apply sort direction
        if sort_direction.lower() == "desc":
            order_clause = sort_column.desc()
        else:
            order_clause = sort_column.asc()

        stmt = (
            select(Address)
            .order_by(order_clause)
            .limit(limit)
            .offset(offset)
        )
        return list(db.scalars(stmt).all())

    def create(
        self,
        db: Session,
        *,
        first_name: str,
        last_name: str,
        street: str,
        apartment_no: str | None,
        city: str,
        postal_code: str,
        description: str | None = None,
    ) -> Address:
        address = Address(
            first_name=first_name,
            last_name=last_name,
            street=street,
            apartment_no=apartment_no,
            city=city,
            postal_code=postal_code,
            description=description,
        )
        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    def list_all(self, db: Session) -> List[Address]:
        """Return all addresses ordered by last_name, first_name.

        Intended for export operations where we need the full dataset.
        """
        stmt: Select[tuple[Address]] = select(Address).order_by(
            Address.last_name.asc(),
            Address.first_name.asc(),
            Address.id.asc(),
        )
        return list(db.scalars(stmt).all())

    def update(
        self,
        db: Session,
        address: Address,
        *,
        first_name: str | None = None,
        last_name: str | None = None,
        street: str | None = None,
        apartment_no: str | None = None,
        city: str | None = None,
        postal_code: str | None = None,
        # description sentinel:
        #   Ellipsis => leave unchanged; None => clear; str => set
        description: Union[str, None, object] = ...,  # Ellipsis value
        label_marked: bool | None = None,
    ) -> Address:
        if first_name is not None:
            address.first_name = first_name
        if last_name is not None:
            address.last_name = last_name
        if street is not None:
            address.street = street
        if apartment_no is not None:
            address.apartment_no = apartment_no
        if city is not None:
            address.city = city
        if postal_code is not None:
            address.postal_code = postal_code
        if description is not ...:
            # Explicitly provided (may be None meaning clear)
            address.description = description  # type: ignore[assignment]
        if label_marked is not None:
            address.label_marked = label_marked

        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    def delete(self, db: Session, address_id: int) -> None:
        stmt = delete(Address).where(Address.id == address_id)
        db.execute(stmt)
        db.commit()

    def search(
        self,
        db: Session,
        *,
        q: str | None = None,
        label_marked: bool | None = None,
        limit: int = 50,
        offset: int = 0,
        sort_field: str = "id",
        sort_direction: str = "asc",
    ) -> List[Address]:
        filters: list = []

        if label_marked is not None:
            filters.append(Address.label_marked == label_marked)

        if q:
            q_filter = or_(
                Address.first_name.ilike(f"%{q}%"),
                Address.last_name.ilike(f"%{q}%"),
                Address.street.ilike(f"%{q}%"),
                Address.city.ilike(f"%{q}%"),
                Address.postal_code.ilike(f"%{q}%"),
            )
            filters.append(q_filter)

        where_expr = and_(*filters) if filters else None

        # Validate sort field
        valid_fields = [
            "id", "first_name", "last_name", "street", "apartment_no",
            "city", "postal_code", "description", "label_marked"
        ]
        if sort_field not in valid_fields:
            sort_field = "id"

        # Get the column to sort by
        sort_column = getattr(Address, sort_field)

        # Apply sort direction
        if sort_direction.lower() == "desc":
            order_clause = sort_column.desc()
        else:
            order_clause = sort_column.asc()

        stmt: Select[tuple[Address]] = select(Address)
        if where_expr is not None:
            stmt = stmt.where(where_expr)
        stmt = stmt.order_by(order_clause)
        stmt = stmt.limit(limit).offset(offset)

        return list(db.scalars(stmt).all())
