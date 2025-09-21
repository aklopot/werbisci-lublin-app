from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_user
from .models import Address
from .repositories import AddressRepository
from .schemas import AddressCreate, AddressRead, AddressUpdate
from .services import AddressService
router = APIRouter(prefix="/api/addresses", tags=["addresses"])


@router.get("", response_model=List[AddressRead])
def list_addresses(
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> List[Address]:
    repo = AddressRepository()
    return repo.list(db, limit=limit, offset=offset)


@router.post(
    "",
    response_model=AddressRead,
    status_code=status.HTTP_201_CREATED,
)
def create_address(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
) -> Address:
    service = AddressService()
    try:
        address = service.create(
            db,
            first_name=payload.first_name,
            last_name=payload.last_name,
            street=payload.street,
            apartment_no=payload.apartment_no,
            city=payload.city,
            postal_code=payload.postal_code,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return address


@router.get("/search", response_model=List[AddressRead])
def search_addresses(
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
    q: str | None = Query(default=None),
    first_name: str | None = Query(default=None),
    last_name: str | None = Query(default=None),
    city: str | None = Query(default=None),
    street: str | None = Query(default=None),
    label_marked: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> List[Address]:
    service = AddressService()
    return service.search(
        db,
        q=q,
        first_name=first_name,
        last_name=last_name,
        city=city,
        street=street,
        label_marked=label_marked,
        limit=limit,
        offset=offset,
    )


@router.patch("/{address_id}", response_model=AddressRead)
def update_address(
    address_id: int,
    payload: AddressUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
) -> Address:
    repo = AddressRepository()
    address = repo.get_by_id(db, address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    service = AddressService(repo)
    try:
        updated = service.update(
            db,
            address,
            first_name=payload.first_name,
            last_name=payload.last_name,
            street=payload.street,
            apartment_no=payload.apartment_no,
            city=payload.city,
            postal_code=payload.postal_code,
            label_marked=payload.label_marked,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return updated


@router.delete(
    "/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
) -> Response:
    repo = AddressRepository()
    repo.delete(db, address_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
