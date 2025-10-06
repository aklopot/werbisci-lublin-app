from __future__ import annotations

import re
from typing import Optional

from sqlalchemy.orm import Session

from .models import Address
from .repositories import AddressRepository
POSTAL_CODE_RE = re.compile(r"^[0-9A-Za-z\-\s]{3,20}$")


class AddressService:
    def __init__(self, repo: Optional[AddressRepository] = None) -> None:
        self.repo = repo or AddressRepository()

    def _normalize_postal_code(self, postal_code: str) -> str:
        normalized = postal_code.strip()
        if not POSTAL_CODE_RE.match(normalized):
            # Leave validation lenient; API may apply stricter checks later
            # but keep it within allowed charset/length
            raise ValueError("Invalid postal code format")
        # Uppercase letters; keep digits and dash/space as-is
        return normalized.upper()

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
        normalized_postal = self._normalize_postal_code(postal_code)
        processed_description = (
            description.strip() if description and description.strip()
            else None
        )
        return self.repo.create(
            db,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            street=street.strip(),
            apartment_no=(apartment_no.strip() if apartment_no else None),
            city=city.strip(),
            postal_code=normalized_postal,
            description=processed_description,
        )

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
        description: str | None = None,
        label_marked: bool | None = None,
    ) -> Address:
        normalized_postal: str | None = None
        if postal_code is not None:
            normalized_postal = self._normalize_postal_code(postal_code)

        return self.repo.update(
            db,
            address,
            first_name=(
                first_name.strip() if isinstance(first_name, str) else None
            ),
            last_name=(
                last_name.strip() if isinstance(last_name, str) else None
            ),
            street=(street.strip() if isinstance(street, str) else None),
            apartment_no=(
                apartment_no.strip() if isinstance(apartment_no, str) else None
            ),
            city=(city.strip() if isinstance(city, str) else None),
            postal_code=normalized_postal,
            description=(
                description.strip()
                if isinstance(description, str) and description.strip()
                else ...
            ),
            label_marked=label_marked,
        )

    def search(self, db: Session, **kwargs):
        return self.repo.search(db, **kwargs)
