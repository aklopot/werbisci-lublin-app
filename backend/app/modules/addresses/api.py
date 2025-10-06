from __future__ import annotations

from typing import List
from io import StringIO, BytesIO
import csv

import logging

from fastapi import (
    APIRouter, Depends, HTTPException, Query, Response, status, UploadFile,
    File,
)
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.deps import (
    get_db, require_user, require_manager_qh, require_manager
)
from .models import Address
from .repositories import AddressRepository
from .schemas import AddressCreate, AddressRead, AddressUpdate
from .services import AddressService

logger = logging.getLogger("addresses.import")
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


@router.delete("/clear-data")
def clear_addresses_data(
    db: Session = Depends(get_db),
    _: object = Depends(require_manager),
) -> dict:
    """Clear all data from addresses table. This operation cannot be undone."""
    try:
        # Delete all records from addresses table
        db.execute(text("DELETE FROM addresses"))
        db.commit()

        return {
            "message": "All addresses data has been cleared successfully",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing addresses data: {str(e)}"
        )


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
    """Import addresses from CSV file (simple deterministic path).

        Wymagane kolumny:
            first_name,last_name,street,apartment_no,city,postal_code,label_marked
        Opcjonalna kolumna: description (aliasy: opis, uwagi, uwaga,
            notatka, notatki, notes)
    Kolumna id – ignorowana.
    """
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        content_raw = file.file.read().decode('utf-8-sig')
        if not content_raw.strip():
            raise HTTPException(status_code=400, detail="CSV file is empty")

        # delimiter detection
        head = content_raw[:2048]
        delimiter = ','
        try:
            delimiter = csv.Sniffer().sniff(head, delimiters=',;').delimiter
        except Exception:
            if (
                head.splitlines()
                and head.splitlines()[0].count(';')
                > head.splitlines()[0].count(',')
            ):
                delimiter = ';'

        # Prepare DictReader with normalized header mapping
        alias_map = {
            'opis': 'description',
            'uwagi': 'description',
            'uwaga': 'description',
            'notatka': 'description',
            'notatki': 'description',
            'notes': 'description',
        }

        # Manually parse first line to normalize headers, then rebuild CSV
        sio_all = StringIO(content_raw)
        raw_reader = csv.reader(sio_all, delimiter=delimiter)
        try:
            raw_headers = next(raw_reader)
        except StopIteration:
            raise HTTPException(
                status_code=400, detail="CSV has no header row"
            )

        logger.info(
            "IMPORT CSV start file=%s delim=%s",  # noqa: G004
            file.filename,
            delimiter,
        )
        logger.info("RAW HEADER: %s", raw_headers)  # noqa: G004

        normalized_headers = []
        for h in raw_headers:
            norm = h.strip().lower()
            norm = alias_map.get(norm, norm)
            normalized_headers.append(norm)

        required = {
            'first_name', 'last_name', 'street', 'apartment_no', 'city',
            'postal_code', 'label_marked'
        }
        missing = [h for h in required if h not in normalized_headers]
        logger.info(
            "NORMALIZED HEADER: %s (missing=%s)",  # noqa: G004
            normalized_headers,
            missing,
        )
        if missing:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Missing required columns: "
                    + ', '.join(sorted(missing))
                )
            )

    # Reconstruct CSV with normalized headers so DictReader keys are std
        rebuilt = StringIO()
        writer = csv.writer(rebuilt, delimiter=delimiter)
        writer.writerow(normalized_headers)
        for row in raw_reader:
            writer.writerow(row)
        rebuilt.seek(0)

        reader = csv.DictReader(rebuilt, delimiter=delimiter)
        logger.info(
            "BEGIN ROW PARSE has_description=%s",  # noqa: G004
            'description' in normalized_headers,
        )

        service = AddressService()
        imported = 0
        errors: list[str] = []
        for line_no, row in enumerate(reader, start=2):  # start=2 (1=header)
            try:
                if not any((v or '').strip() for v in row.values()):
                    continue
                first_name = (row.get('first_name') or '').strip()
                last_name = (row.get('last_name') or '').strip()
                street = (row.get('street') or '').strip()
                apartment_no = (row.get('apartment_no') or '').strip() or None
                city = (row.get('city') or '').strip()
                postal_code = (row.get('postal_code') or '').strip()
                description = (row.get('description') or '').strip() or None
                if description:
                    description = description[:500]
                label_marked_raw = (
                    (row.get('label_marked') or '').strip().lower()
                )
                label_marked = label_marked_raw in {
                    '1', 'true', 'yes', 'tak', 'y', 't'
                }

                # validations
                if not first_name:
                    raise ValueError('first_name is required')
                if not last_name:
                    raise ValueError('last_name is required')
                if not street:
                    raise ValueError('street is required')
                if not city:
                    raise ValueError('city is required')
                if not postal_code:
                    raise ValueError('postal_code is required')

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
                if label_marked:
                    # don't touch description
                    service.update(
                        db,
                        address,
                        label_marked=True,
                        description=...,  # sentinel keep
                    )
                imported += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "IMPORT ROW ERROR line=%s err=%s row=%s",  # noqa: G004
                    line_no,
                    exc,
                    row,
                )
                errors.append(f"Row {line_no}: {exc}")
                continue

        logger.info(
            "IMPORT FINISHED imported=%s errors=%s",  # noqa: G004
            imported,
            len(errors),
        )
        return {
            'imported_count': imported,
            'total_rows': line_no - 1 if 'line_no' in locals() else 0,
            'errors': errors[:10],
            'has_more_errors': len(errors) > 10,
            'used_delimiter': delimiter,
            'has_description_column': 'description' in normalized_headers,
            'description_columns_used': (
                ['description'] if 'description' in normalized_headers else []
            ),
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=400,
            detail=f"Error processing CSV file: {exc}"
        )


@router.post("/recreate-schema", status_code=status.HTTP_200_OK)
def recreate_addresses_schema(
    db: Session = Depends(get_db),
    _: object = Depends(require_manager),
) -> dict:
    """Drop and recreate addresses table with clean schema. This operation
    cannot be undone."""
    try:
        # Drop the addresses table
        db.execute(text("DROP TABLE IF EXISTS addresses"))
        db.commit()

        # Recreate the table using SQLAlchemy metadata
        from app.core.db import Base
        Base.metadata.create_all(bind=db.bind, tables=[Address.__table__])

        return {
            "message": "Addresses table has been recreated successfully",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recreating addresses schema: {str(e)}"
        )
