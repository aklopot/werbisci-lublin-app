from __future__ import annotations

from typing import List
from io import StringIO, BytesIO
import csv

from fastapi import (
    APIRouter, Depends, HTTPException, Query, Response, status, UploadFile, File
)
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_user, require_manager_qh
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
    sort_field: str = Query(default="id"),
    sort_direction: str = Query(default="asc"),
) -> List[Address]:
    repo = AddressRepository()
    return repo.list(
        db,
        limit=limit,
        offset=offset,
        sort_field=sort_field,
        sort_direction=sort_direction
    )


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
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return address


@router.get("/search", response_model=List[AddressRead])
def search_addresses(
    db: Session = Depends(get_db),
    _: object = Depends(require_user),
    q: str | None = Query(default=None),
    label_marked: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sort_field: str = Query(default="id"),
    sort_direction: str = Query(default="asc"),
) -> List[Address]:
    service = AddressService()
    return service.search(
        db,
        q=q,
        label_marked=label_marked,
        limit=limit,
        offset=offset,
        sort_field=sort_field,
        sort_direction=sort_direction,
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
            description=payload.description,
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


def _addresses_as_rows(addresses: List[Address]) -> list[list[str]]:
    rows: list[list[str]] = []
    for a in addresses:
        rows.append([
            str(a.id),
            a.first_name,
            a.last_name,
            a.street,
            a.apartment_no or "",
            a.city,
            a.postal_code,
            a.description or "",
            "1" if a.label_marked else "0",
        ])
    return rows


@router.get("/export.csv", response_class=Response)
def export_addresses_csv(
    db: Session = Depends(get_db),
    _: object = Depends(require_manager_qh),
) -> Response:
    repo = AddressRepository()
    items = repo.list_all(db)

    headers = [
        "id",
        "first_name",
        "last_name",
        "street",
        "apartment_no",
        "city",
        "postal_code",
        "description",
        "label_marked",
    ]
    buf = StringIO(newline="")
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(_addresses_as_rows(items))
    # Include BOM for Excel compatibility
    content = buf.getvalue().encode("utf-8-sig")
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=addresses.csv",
        },
    )


@router.get("/export.ods", response_class=Response)
def export_addresses_ods(
    db: Session = Depends(get_db),
    _: object = Depends(require_manager_qh),
) -> Response:
    from collections import OrderedDict
    try:
        from pyexcel_ods3 import save_data  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=500,
            detail="ODS export not available",
        ) from exc

    repo = AddressRepository()
    items = repo.list_all(db)

    headers_row = [
        "id",
        "first_name",
        "last_name",
        "street",
        "apartment_no",
        "city",
        "postal_code",
        "description",
        "label_marked",
    ]
    rows = _addresses_as_rows(items)

    data = OrderedDict()
    data.update({"Addresses": [headers_row, *rows]})
    out = BytesIO()
    save_data(out, data)
    content = out.getvalue()
    return Response(
        content=content,
        media_type="application/vnd.oasis.opendocument.spreadsheet",
        headers={
            "Content-Disposition": "attachment; filename=addresses.ods",
        },
    )


@router.get("/export.pdf", response_class=Response)
def export_addresses_pdf(
    db: Session = Depends(get_db),
    _: object = Depends(require_manager_qh),
) -> Response:
    # Simple tabular PDF using reportlab canvas
    from reportlab.lib.pagesizes import A4  # type: ignore
    from reportlab.pdfgen import canvas  # type: ignore

    repo = AddressRepository()
    items = repo.list_all(db)

    page_w, page_h = A4
    buf = BytesIO()
    pdf = canvas.Canvas(buf, pagesize=A4)
    pdf.setTitle("Addresses Export")

    left_margin = 36
    top_margin = 36
    y = page_h - top_margin

    # Header
    headers = [
        ("ID", 36),
        ("First name", 120),
        ("Last name", 280),
        ("City", 440),
        ("Postal", 520),
    ]
    pdf.setFont("Helvetica-Bold", 11)
    for title, x in headers:
        pdf.drawString(left_margin + x, y, title)
    y -= 16
    pdf.line(left_margin + 30, y, page_w - left_margin, y)
    y -= 14

    pdf.setFont("Helvetica", 10)
    line_height = 14
    for a in items:
        if y < 36:
            pdf.showPage()
            y = page_h - top_margin
            pdf.setFont("Helvetica-Bold", 11)
            for title, x in headers:
                pdf.drawString(left_margin + x, y, title)
            y -= 16
            pdf.line(
                left_margin + 30,
                y,
                page_w - left_margin,
                y,
            )
            y -= 14
            pdf.setFont("Helvetica", 10)

        pdf.drawString(left_margin + 36, y, str(a.id))
        pdf.drawString(left_margin + 120, y, a.first_name)
        pdf.drawString(left_margin + 280, y, a.last_name)
        pdf.drawString(left_margin + 440, y, a.city)
        pdf.drawString(left_margin + 520, y, a.postal_code)
        y -= line_height

    pdf.showPage()
    pdf.save()
    content = buf.getvalue()
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=addresses.pdf",
        },
    )


@router.post("/import.csv", response_model=dict)
def import_addresses_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: object = Depends(require_manager_qh),
) -> dict:
    """Import addresses from CSV file. Ignores 'id' column and generates new IDs."""
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )

    try:
        # Read file content
        content = file.file.read().decode('utf-8-sig')  # Handle BOM
        csv_reader = csv.DictReader(StringIO(content))

        # Validate headers
        expected_headers = {
            'first_name', 'last_name', 'street', 'apartment_no',
            'city', 'postal_code', 'description', 'label_marked'
        }
        actual_headers = set(csv_reader.fieldnames or [])

        # Check if all required headers are present
        # (id is optional and will be ignored)
        missing_headers = expected_headers - actual_headers
        if missing_headers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_headers)}"
            )

        service = AddressService()
        imported_count = 0
        errors = []

        # Start from 2 because header is row 1
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Extract data, ignoring 'id' column
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                street = row.get('street', '').strip()
                apartment_no = row.get('apartment_no', '').strip() or None
                city = row.get('city', '').strip()
                postal_code = row.get('postal_code', '').strip()
                description = row.get('description', '').strip() or None
                label_marked = row.get('label_marked', '').strip().lower() in (
                    '1', 'true', 'yes', 'tak'
                )

                # Validate required fields
                if not first_name:
                    raise ValueError("first_name is required")
                if not last_name:
                    raise ValueError("last_name is required")
                if not street:
                    raise ValueError("street is required")
                if not city:
                    raise ValueError("city is required")
                if not postal_code:
                    raise ValueError("postal_code is required")

                # Create address
                address = service.create(
                    db,
                    first_name=first_name,
                    last_name=last_name,
                    street=street,
                    apartment_no=apartment_no,
                    city=city,
                    postal_code=postal_code,
                    description=description,
                )

                # Update label_marked if needed
                if label_marked:
                    service.update(
                        db,
                        address,
                        label_marked=True
                    )

                imported_count += 1

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue

        return {
            "imported_count": imported_count,
            "total_rows": row_num - 1,  # Subtract 1 for header row
            "errors": errors[:10],  # Limit errors to first 10
            "has_more_errors": len(errors) > 10
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing CSV file: {str(e)}"
        )
