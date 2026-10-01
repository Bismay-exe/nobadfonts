"""
extractor.py
============
Font binary metadata extractor using FontTools.

Extracts: family name, subfamily, weight class, width class,
variable axes, glyph count, unicode coverage, version, formats.

Returns a structured dict — no exceptions raised; missing fields
are represented as None so callers can flag them.
"""

from __future__ import annotations

import io
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Maximum font binary size to process (5 MB)
MAX_FONT_BYTES = 5 * 1024 * 1024

# Supported font formats by file extension
SUPPORTED_EXTENSIONS = {".ttf", ".otf", ".woff", ".woff2"}


def extract_font_metadata(font_bytes: bytes, filename: str) -> dict[str, Any]:
    """
    Extract metadata from a font binary.

    Args:
        font_bytes: Raw font file bytes.
        filename:   Original filename (used to infer format).

    Returns:
        dict with all extracted fields. Values are None when not available.
    """
    result: dict[str, Any] = {
        "filename":           filename,
        "format":             _infer_format(filename),
        "file_size_bytes":    len(font_bytes),
        "family_name":        None,
        "typographic_family": None,
        "subfamily":          None,
        "full_name":          None,
        "postscript_name":    None,
        "version_string":     None,
        "designer":           None,
        "manufacturer":       None,
        "vendor_id":          None,
        "weight_class":       None,
        "width_class":        None,
        "is_bold":            None,
        "is_italic":          None,
        "variable_axes":      None,
        "glyph_count":        None,
        "unicode_ranges":     None,
        "category":           None,
        "extraction_error":   None,
    }

    if len(font_bytes) > MAX_FONT_BYTES:
        result["extraction_error"] = f"File too large: {len(font_bytes)} bytes > {MAX_FONT_BYTES}"
        return result

    try:
        # Import here so import errors don't break the whole module
        from fontTools.ttLib import TTFont  # type: ignore
    except ImportError:
        result["extraction_error"] = "fonttools not installed"
        return result

    try:
        font = TTFont(io.BytesIO(font_bytes), lazy=True)
    except Exception as exc:
        result["extraction_error"] = f"Failed to open font: {exc}"
        logger.warning("Font parse error for %s: %s", filename, exc)
        return result

    try:
        # --- name table ---------------------------------------------------------
        name_table = font.get("name")
        if name_table:
            result["family_name"]        = _name(name_table, 1)   # Font Family
            result["typographic_family"] = _name(name_table, 16)  # Typographic Family (preferred)
            result["subfamily"]          = _name(name_table, 2)   # Subfamily
            result["full_name"]          = _name(name_table, 4)   # Full name
            result["postscript_name"]    = _name(name_table, 6)   # PostScript name
            result["version_string"]     = _name(name_table, 5)   # Version string
            result["designer"]           = _name(name_table, 9)   # Designer
            result["manufacturer"]       = _name(name_table, 8)   # Manufacturer

        # --- OS/2 table ---------------------------------------------------------
        os2 = font.get("OS/2")
        if os2:
            result["weight_class"] = getattr(os2, "usWeightClass", None)
            result["width_class"]  = getattr(os2, "usWidthClass", None)
            result["vendor_id"]    = getattr(os2, "achVendID", None)
            fs_selection           = getattr(os2, "fsSelection", 0)
            result["is_bold"]      = bool(fs_selection & 0x0020)
            result["is_italic"]    = bool(fs_selection & 0x0001)
            result["category"]     = _infer_category(font)

        # --- head table ---------------------------------------------------------
        # (version is already extracted from name table)

        # --- Variable axes (fvar) -----------------------------------------------
        fvar = font.get("fvar")
        if fvar:
            result["variable_axes"] = [
                {
                    "tag":     ax.axisTag,
                    "name":    _name(name_table, ax.axisNameID) if name_table else None,
                    "minimum": ax.minValue,
                    "default": ax.defaultValue,
                    "maximum": ax.maxValue,
                }
                for ax in fvar.axes
            ]

        # --- Glyph count --------------------------------------------------------
        glyf = font.get("glyf") or font.get("CFF ")
        if font.get("GlyphOrder"):
            result["glyph_count"] = len(font.getGlyphOrder())

        # --- Unicode coverage (cmap) --------------------------------------------
        cmap = font.getBestCmap()
        if cmap:
            codepoints = sorted(cmap.keys())
            result["unicode_ranges"] = _summarize_unicode(codepoints)

    except Exception as exc:
        result["extraction_error"] = f"Partial extraction error: {exc}"
        logger.warning("Extraction error in %s: %s", filename, exc)

    finally:
        try:
            font.close()
        except Exception:
            pass

    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _name(name_table: Any, name_id: int) -> str | None:
    """Get a name record, preferring English (platform 3, enc 1)."""
    rec = name_table.getName(name_id, 3, 1, 0x0409)  # Windows, Unicode BMP, English
    if rec is None:
        rec = name_table.getName(name_id, 1, 0, 0)   # Mac, Roman, English
    if rec is None:
        return None
    try:
        return rec.toUnicode().strip() or None
    except Exception:
        return None


def _infer_format(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return {
        "ttf":   "TrueType",
        "otf":   "OpenType-CFF",
        "woff":  "WOFF",
        "woff2": "WOFF2",
    }.get(ext, "Unknown")


def _infer_category(font: Any) -> str | None:
    """Best-effort serif/sans-serif/monospaced classification from OS/2 panose."""
    try:
        os2 = font["OS/2"]
        panose = getattr(os2, "panose", None)
        if panose is None:
            return None
        family_kind  = getattr(panose, "bFamilyType", 0)
        serif_style  = getattr(panose, "bSerifStyle", 0)
        proportion   = getattr(panose, "bProportion", 0)

        if family_kind == 3:
            return "handwriting"
        if family_kind == 4:
            return "decorative"
        if proportion == 9:
            return "monospace"
        if serif_style in (2, 3, 4, 5, 6, 7):
            return "serif"
        if serif_style in (11, 12, 13, 14, 15):
            return "sans-serif"
        return None
    except Exception:
        return None


def _summarize_unicode(codepoints: list[int]) -> dict[str, Any]:
    """Summarize unicode coverage as range count and block names."""
    if not codepoints:
        return {"count": 0, "blocks": []}

    blocks: list[str] = []
    try:
        import unicodedata

        seen_blocks: set[str] = set()
        for cp in codepoints[:2000]:   # sample first 2000
            try:
                name = unicodedata.name(chr(cp), "")
                block = name.split(" ")[0] if name else "Unknown"
                seen_blocks.add(block)
            except Exception:
                pass
        blocks = sorted(seen_blocks)[:20]  # cap at 20 blocks
    except ImportError:
        pass

    return {
        "count":  len(codepoints),
        "blocks": blocks,
    }
