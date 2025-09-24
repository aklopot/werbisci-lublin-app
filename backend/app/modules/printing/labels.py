from __future__ import annotations

from io import BytesIO
from typing import Any, Iterable, List

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# Reuse font registration and address formatting from envelope generator
from .envelope import _register_unicode_fonts, _format_recipient_address


def _iter_in_pages(
    items: Iterable[Any], page_size: int
) -> Iterable[list[Any]]:
    page: list[Any] = []
    for item in items:
        page.append(item)
        if len(page) == page_size:
            yield page
            page = []
    if page:
        yield page


def generate_labels_pdf(addresses: List[Any], font_size: int = 11) -> bytes:
    """Generate multi-page A4 labels PDF with a 3×7 grid per page.

    Parameters
    ----------
    addresses: list of address-like objects with fields first_name, last_name,
        street, apartment_no, city, postal_code
    font_size: base font size for label text (clamped to 8..24)
    """
    # Clamp reasonable font sizes for labels
    if font_size < 8:
        font_size = 8
    if font_size > 24:
        font_size = 24

    buffer = BytesIO()
    page_width, page_height = A4
    pdf = canvas.Canvas(buffer, pagesize=A4)

    # 3 columns x 7 rows grid, no page margins as per spec
    columns = 3
    rows = 7
    per_page = columns * rows
    cell_w = page_width / columns
    cell_h = page_height / rows

    # Small internal padding inside each cell to avoid text hugging borders
    inner_pad_x = 8
    inner_pad_y = 8
    line_gap = int(font_size * 1.2)

    fonts = _register_unicode_fonts()
    pdf.setTitle("Labels 3x7")

    for page_items in _iter_in_pages(addresses, per_page):
        for idx, address in enumerate(page_items):
            col = idx % columns
            # 0 at top row visually requires top-origin calc
            row = idx // columns

            # Compute text origin near the top-left inside the cell
            x = col * cell_w + inner_pad_x
            # Convert row index to y coordinate from top
            top_y = page_height - (row * cell_h) - inner_pad_y

            # Prepare address lines
            lines = _format_recipient_address(address)

            # Draw lines
            y = top_y - font_size  # first baseline
            pdf.setFont(fonts["regular"], font_size)
            for line in lines:
                pdf.drawString(x, y, line)
                y -= line_gap

        pdf.showPage()

    pdf.save()
    return buffer.getvalue()


__all__ = ["generate_labels_pdf"]
