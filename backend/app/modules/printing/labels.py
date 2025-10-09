from __future__ import annotations

from io import BytesIO
from typing import Any, Iterable, List

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# Reuse font registration from envelope generator
from .envelope import _register_unicode_fonts


def _format_label_address(address: Any) -> list[str]:
    """Format address for labels with 'Sz. P.' prefix."""
    name = f"Sz. P. {address.first_name} {address.last_name}".strip()
    street = address.street
    if getattr(address, "apartment_no", None):
        street = f"{street} {address.apartment_no}"
    city_line = f"{address.postal_code} {address.city}".strip()
    return [name, street, city_line]


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

    fonts = _register_unicode_fonts()
    pdf.setTitle("Etykiety 3x7")
    pdf.setAuthor("Misjonarze Werbisci Lublin")

    for page_items in _iter_in_pages(addresses, per_page):
        for idx, address in enumerate(page_items):
            col = idx % columns
            # 0 at top row visually requires top-origin calc
            row = idx // columns

            # Calculate cell boundaries
            cell_left = col * cell_w
            cell_right = cell_left + cell_w
            cell_top = page_height - (row * cell_h)
            cell_bottom = cell_top - cell_h
            
            # Center point of the cell
            cell_center_x = (cell_left + cell_right) / 2
            cell_center_y = (cell_top + cell_bottom) / 2

            # Prepare address lines
            lines = _format_label_address(address)
            
            # Split the first line if it contains "Sz. P." + name
            display_lines = []
            for line in lines:
                if '\n' in line:
                    display_lines.extend(line.split('\n'))
                else:
                    display_lines.append(line)
            
            # Calculate different line gaps
            normal_gap = int(font_size * 1.2)
            name_to_address_gap = int(font_size * 2.2)  # Reduced from 3.0
            address_lines_gap = int(font_size * 1.6)   # Increased from 0.8
            
            # Calculate total text block height with different gaps
            total_height = len(display_lines) * font_size
            if len(display_lines) >= 3:  # Name + street + city
                # Big gap after name (line 0), small gap after street (line 1)
                total_height += name_to_address_gap + address_lines_gap
                # Normal gaps for any additional lines
                total_height += (len(display_lines) - 3) * normal_gap
            elif len(display_lines) == 2:
                total_height += name_to_address_gap
            
            # Calculate starting Y position to center text block vertically
            # Add small offset to move text slightly down (more space above name)
            vertical_offset = font_size * 0.3  # 30% of font size as top margin
            start_y = (
                cell_center_y + (total_height / 2) - font_size
                - vertical_offset
            )

            # Draw lines centered horizontally and vertically
            y = start_y
            for i, line in enumerate(display_lines):
                # Set font - bold for address lines, regular for name
                if i >= 1:  # Address lines (street + number, postal + city)
                    pdf.setFont(fonts["bold"], font_size)
                    line_width = pdf.stringWidth(
                        line, fonts["bold"], font_size
                    )
                else:  # Name line ("Sz. P. [Imię] [Nazwisko]")
                    pdf.setFont(fonts["regular"], font_size)
                    line_width = pdf.stringWidth(
                        line, fonts["regular"], font_size
                    )
                
                # Calculate line width and center it horizontally
                x = cell_center_x - (line_width / 2)
                
                # Ensure text doesn't go outside cell boundaries
                if x < cell_left + inner_pad_x:
                    x = cell_left + inner_pad_x
                elif x + line_width > cell_right - inner_pad_x:
                    x = cell_right - inner_pad_x - line_width
                
                pdf.drawString(x, y, line)
                
                # Apply appropriate gap for next line
                if i == 0:  # After name line ("Sz. P. [Imię] [Nazwisko]")
                    y -= name_to_address_gap  # Big gap
                elif i == 1:  # After street line
                    y -= address_lines_gap    # Small gap
                else:  # Between other lines
                    y -= normal_gap

        pdf.showPage()

    pdf.save()
    return buffer.getvalue()


__all__ = ["generate_labels_pdf"]
