from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_user
from app.modules.addresses.repositories import AddressRepository
from .envelope import EnvelopeOptions, generate_envelope_pdf


router = APIRouter(prefix="/api/print", tags=["print"])


@router.get("/envelope/{address_id}", response_class=Response)
def print_envelope(
    address_id: int,
    bold: bool = Query(default=False),
    font_size: int = Query(default=14, ge=10, le=36),
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
) -> Response:
    repo = AddressRepository()
    address = repo.get_by_id(db, address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    pdf_bytes = generate_envelope_pdf(
        address,
        EnvelopeOptions(bold=bold, font_size=font_size),
    )
    return Response(content=pdf_bytes, media_type="application/pdf")


__all__ = ["router"]
