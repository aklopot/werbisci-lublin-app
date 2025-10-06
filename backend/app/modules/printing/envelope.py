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
                Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
                Path(
                    "/usr/share/fonts/truetype/liberation/"
                    "LiberationSans-Regular.ttf"
                ),
                Path("C:/Windows/Fonts/arial.ttf"),
                _get_assets_path() / "DejaVuSans.ttf",
            ],
        ),
        (
            "AppSans-Bold",
            [
                Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
                Path(
                    "/usr/share/fonts/truetype/liberation/"
                    "LiberationSans-Bold.ttf"
                ),
                Path("C:/Windows/Fonts/arialbd.ttf"),
                _get_assets_path() / "DejaVuSans-Bold.ttf",
            ],
        ),
        (
            "AppSans-Italic",
            [
                Path(
                    "/usr/share/fonts/truetype/dejavu/"
                    "DejaVuSans-Oblique.ttf"
                ),
                Path(
                    "/usr/share/fonts/truetype/liberation/"
                    "LiberationSans-Italic.ttf"
                ),
                Path("C:/Windows/Fonts/ariali.ttf"),
                _get_assets_path() / "DejaVuSans-Oblique.ttf",
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
                    print(
                        f"Successfully registered font: {font_name} "
                        f"from {p}"
                    )
                    break
            except Exception as e:
                print(f"Failed to register font {font_name} from {p}: {e}")
                # Try next path
                continue

    # Build mapping with fallbacks to core fonts
    mapping = {
        "regular": registered.get("AppSans", "Helvetica"),
        "bold": registered.get("AppSans-Bold", "Helvetica-Bold"),
        "italic": registered.get("AppSans-Italic", "Helvetica-Oblique"),
    }

    print(f"Font mapping: {mapping}")
    _REGISTERED_FONTS = mapping
    return mapping


def _draw_sender_block(
    pdf: canvas.Canvas,
    page_width: float,
    page_height: float,
) -> None:
    assets_dir = _get_assets_path()
    logo_path = assets_dir / "logo.png"
    # ================= Configuration constants (easy to tweak) ==============
    # Horizontal offset of the whole sender block (logo + text) from the left.
    # (Original was 36). We move a bit towards the page center as requested.
    X_LOGO = 105  # moved further right (previously 54)
    # Distance from top (original top margin 36). We lower slightly
    # ("delikatnie obniżamy").
    TOP_MARGIN = 55
    # Target logo width (original 72). "Zmniejszamy logo (dość mocno)".
    LOGO_WIDTH = 34
    # Gap between logo and text (original 12) -> "bliżej siebie".
    LOGO_TEXT_GAP = 6
    # Sender line heights / spacing
    SENDER_FIRST_LINE_FONT_SIZE = 10
    SENDER_OTHER_LINES_FONT_SIZE = 9
    SENDER_LINE_SPACING = 11  # was 12; slightly tighter

    # ===========================================================================

    # Compute top coordinate
    y_logo_top = page_height - TOP_MARGIN

    # Draw (smaller) logo
    logo_width = LOGO_WIDTH
    logo_height = None
    try:
        if logo_path.exists():
            img = ImageReader(str(logo_path))
            iw, ih = img.getSize()
            aspect = ih / float(iw) if iw else 1.0
            logo_height = logo_width * aspect
            pdf.drawImage(
                img,
                X_LOGO,
                y_logo_top - logo_height,
                width=logo_width,
                height=logo_height,
                preserveAspectRatio=True,
                mask="auto",
            )
        else:
            raise FileNotFoundError(str(logo_path))
    except Exception:
        # Fallback text if logo not available
        logo_height = 20
        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(X_LOGO, y_logo_top - 16, "WERBISCI")

    # Sender text block definition
    sender_lines = [
        "Misjonarze Werbiści",
        "ul. Jagiellońska 45",
        "20-806 Lublin",
    ]
    fonts = _register_unicode_fonts()

    # Compute max width to center each line relative to the widest
    # ("wyśrodkować względem siebie").
    widths: list[float] = []
    for i, line in enumerate(sender_lines):
        if i == 0:
            w = pdf.stringWidth(
                line, fonts["bold"], SENDER_FIRST_LINE_FONT_SIZE
            )
        else:
            w = pdf.stringWidth(
                line, fonts["regular"], SENDER_OTHER_LINES_FONT_SIZE
            )
        widths.append(w)
    block_width = max(widths)

    # Left edge of text block
    text_block_left = X_LOGO + logo_width + LOGO_TEXT_GAP
    # Vertical start baseline for first line (slightly below top of logo)
    # Gentle vertical alignment tweak of text block relative to logo height
    text_y = y_logo_top - (logo_height * 0.35)

    # Draw first (bold) line centered inside block_width
    center_x = text_block_left + block_width / 2
    pdf.setFont(fonts["bold"], SENDER_FIRST_LINE_FONT_SIZE)
    pdf.drawString(center_x - widths[0] / 2, text_y, sender_lines[0])

    # Draw remaining lines centered, with consistent spacing
    pdf.setFont(fonts["regular"], SENDER_OTHER_LINES_FONT_SIZE)
    text_y -= SENDER_LINE_SPACING
    for idx, line in enumerate(sender_lines[1:], start=1):
        pdf.drawString(center_x - widths[idx] / 2, text_y, line)
        text_y -= SENDER_LINE_SPACING


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

    # ================= Recipient block positioning & spacing ================
    # Move leftwards (decrease x) and upwards (increase start_y) per request.
    right_block_x = page_width * 0.50  # horizontal stays the same for now
    # Move higher (closer to top). Previously 260.
    start_y = page_height - 180  # raised higher (was 230)

    # Unified, slightly wider line spacing including the "Sz. P." prefix.
    line_gap = int(opts.font_size * 1.35)
    italic_size = max(10, opts.font_size - 2)

    pdf.setFont(fonts["italic"], italic_size)
    y = start_y
    pdf.drawString(right_block_x, y, "Sz. P.")
    y -= line_gap

    pdf.setFont(font_name, opts.font_size)
    for line in recipient_lines:
        pdf.drawString(right_block_x, y, line)
        y -= line_gap

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


__all__ = ["EnvelopeOptions", "generate_envelope_pdf"]
