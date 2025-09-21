from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


@dataclass
class EnvelopeOptions:
    bold: bool = False
    font_size: int = 14


def _get_assets_path() -> Path:
    # envelope.py is under app/modules/printing/
    # go up to app/ and then assets/
    return Path(__file__).resolve().parents[2] / "assets"


# Cache for registered fonts so we register once per process
_REGISTERED_FONTS: dict[str, str] | None = None


def _register_unicode_fonts() -> dict[str, str]:
    """Register Unicode TTF fonts for proper Polish diacritics.

    Returns a dict with keys: regular, bold, italic mapping to font names
    usable with setFont(). Falls back to core Helvetica variants on failure.
    """
    global _REGISTERED_FONTS
    if _REGISTERED_FONTS is not None:
        return _REGISTERED_FONTS

    # Candidate font files across common OSes and our assets folder
    candidates: list[tuple[str, list[Path]]] = [
        (
            "AppSans",
            [
                _get_assets_path() / "DejaVuSans.ttf",
                Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
                Path("C:/Windows/Fonts/arial.ttf"),
                Path(
                    "/usr/share/fonts/truetype/liberation/"
                    "LiberationSans-Regular.ttf"
                ),
            ],
        ),
        (
            "AppSans-Bold",
            [
                _get_assets_path() / "DejaVuSans-Bold.ttf",
                Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
                Path("C:/Windows/Fonts/arialbd.ttf"),
                Path(
                    "/usr/share/fonts/truetype/liberation/"
                    "LiberationSans-Bold.ttf"
                ),
            ],
        ),
        (
            "AppSans-Italic",
            [
                _get_assets_path() / "DejaVuSans-Oblique.ttf",
                Path(
                    "/usr/share/fonts/truetype/dejavu/"
                    "DejaVuSans-Oblique.ttf"
                ),
                Path("C:/Windows/Fonts/ariali.ttf"),
                Path(
                    "/usr/share/fonts/truetype/liberation/"
                    "LiberationSans-Italic.ttf"
                ),
            ],
        ),
    ]

    registered: dict[str, str] = {}
    for font_name, paths in candidates:
        for p in paths:
            try:
                if p.exists():
                    pdfmetrics.registerFont(TTFont(font_name, str(p)))
                    registered[font_name] = font_name
                    break
            except Exception:
                # Try next path
                continue

    # Build mapping with fallbacks to core fonts
    mapping = {
        "regular": registered.get("AppSans", "Helvetica"),
        "bold": registered.get("AppSans-Bold", "Helvetica-Bold"),
        "italic": registered.get("AppSans-Italic", "Helvetica-Oblique"),
    }

    _REGISTERED_FONTS = mapping
    return mapping


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

    # Draw logo (smaller) and sender text to the right of the logo
    logo_width = 72  # smaller logo
    logo_height = None
    if logo_path.exists():
        try:
            img = ImageReader(str(logo_path))
            iw, ih = img.getSize()
            aspect = ih / float(iw) if iw else 1.0
            logo_height = logo_width * aspect
            pdf.drawImage(
                img,
                x_logo,
                y_logo_top - logo_height,
                width=logo_width,
                height=logo_height,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            logo_height = 24
            pdf.setFont("Helvetica-Bold", 16)
            pdf.drawString(x_logo, y_logo_top - 18, "WERBISCI")
    else:
        logo_height = 24
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(x_logo, y_logo_top - 18, "WERBISCI")

    # Sender address block placed to the right of the logo
    text_x = x_logo + logo_width + 12
    text_y = y_logo_top - 18
    sender_lines = [
        "Misjonarze Werbiści",
        "ul. Jagiellońska 45",
        "20-806 Lublin",
    ]
    # First line bold, rest regular
    fonts = _register_unicode_fonts()
    pdf.setFont(fonts["bold"], 11)
    pdf.drawString(text_x, text_y, sender_lines[0])
    line_height = 12
    pdf.setFont(fonts["regular"], 10)
    text_y -= line_height
    for line in sender_lines[1:]:
        pdf.drawString(text_x, text_y, line)
        text_y -= line_height


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
    fonts = _register_unicode_fonts()
    font_name = fonts["bold"] if opts.bold else fonts["regular"]

    # Place recipient in the right-middle area, slightly lower
    right_block_x = page_width * 0.58
    start_y = page_height - 320
    line_gap = int(opts.font_size * 1.25)

    # Prefix line "Sz. P." above the name
    pdf.setFont(fonts["italic"], max(10, opts.font_size - 2))
    y = start_y
    pdf.drawString(right_block_x, y, "Sz. P.")
    y -= max(12, int((opts.font_size - 2) * 1.2))

    # Draw recipient lines
    pdf.setFont(font_name, opts.font_size)
    for line in recipient_lines:
        pdf.drawString(right_block_x, y, line)
        y -= line_gap

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


__all__ = ["EnvelopeOptions", "generate_envelope_pdf"]
