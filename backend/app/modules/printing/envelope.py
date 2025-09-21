from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


@dataclass
class EnvelopeOptions:
    bold: bool = False
    font_size: int = 14


def _get_assets_path() -> Path:
    # envelope.py is under app/modules/printing/
    # go up to app/ and then assets/
    return Path(__file__).resolve().parents[2] / "assets"


def _draw_sender_block(
    pdf: canvas.Canvas,
    page_width: float,
    page_height: float,
) -> None:
    assets_dir = _get_assets_path()
    logo_path = assets_dir / "logo.png"

    # Top-left placement for logo
    x_logo = 36
    y_logo_top = page_height - 36

    if logo_path.exists():
        try:
            img = ImageReader(str(logo_path))
            # Target width; height keeps aspect ratio
            target_width = 120
            iw, ih = img.getSize()
            aspect = ih / float(iw) if iw else 1.0
            target_height = target_width * aspect
            pdf.drawImage(
                img,
                x_logo,
                y_logo_top - target_height,
                width=target_width,
                height=target_height,
                preserveAspectRatio=True,
                mask="auto",
            )
            text_start_y = y_logo_top - target_height - 10
        except Exception:
            # If image can't be read, fall back to text placeholder
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(x_logo, y_logo_top - 18, "WERBISCI")
            text_start_y = y_logo_top - 36
    else:
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(x_logo, y_logo_top - 18, "WERBISCI")
        text_start_y = y_logo_top - 36

    # Sender address block under the logo
    sender_lines = [
        "Zgromadzenie Słowa Bożego (Werbiści)",
        "[Sender address here]",
        "Lublin",
    ]
    pdf.setFont("Helvetica", 10)
    line_height = 12
    y = text_start_y
    for line in sender_lines:
        pdf.drawString(x_logo, y, line)
        y -= line_height


def _format_recipient_address(address: Any) -> list[str]:
    name = f"{address.first_name} {address.last_name}".strip()
    street = address.street
    if getattr(address, "apartment_no", None):
        street = f"{street} m. {address.apartment_no}"
    city_line = f"{address.postal_code} {address.city}".strip()
    return [name, street, city_line]


def generate_envelope_pdf(
    address: Any,
    options: EnvelopeOptions | dict | None = None,
) -> bytes:
    """Generate an A4 PDF for an envelope.

    Sender is placed on the left, recipient on the right.

    Parameters
    ----------
    address: model with fields first_name, last_name, street, apartment_no,
        city, postal_code
    options: EnvelopeOptions or dict with keys: bold (bool), font_size (int)
    """
    if options is None:
        opts = EnvelopeOptions()
    elif isinstance(options, dict):
        opts = EnvelopeOptions(
            bold=bool(options.get("bold", False)),
            font_size=int(options.get("font_size", 14)),
        )
    else:
        opts = options

    # Clamp font size to reasonable range
    if opts.font_size < 10:
        opts.font_size = 10
    if opts.font_size > 36:
        opts.font_size = 36

    buffer = BytesIO()
    page_width, page_height = A4
    pdf = canvas.Canvas(buffer, pagesize=A4)

    # Sender (left)
    _draw_sender_block(pdf, page_width, page_height)

    # Recipient (right)
    recipient_lines = _format_recipient_address(address)
    font_name = "Helvetica-Bold" if opts.bold else "Helvetica"
    pdf.setFont(font_name, opts.font_size)

    # Place recipient roughly at right-middle area
    right_block_x = page_width * 0.6
    start_y = page_height - 200
    line_gap = int(opts.font_size * 1.2)
    y = start_y
    for line in recipient_lines:
        pdf.drawString(right_block_x, y, line)
        y -= line_gap

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


__all__ = ["EnvelopeOptions", "generate_envelope_pdf"]
