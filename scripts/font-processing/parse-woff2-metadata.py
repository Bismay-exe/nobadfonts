#!/usr/bin/env python3
"""Read-only WOFF2 metadata extractor using fontTools. Prints one JSON object."""
import json
import sys
from fontTools.ttLib import TTFont


def name_value(font, name_id):
    try:
        records = font["name"].names
    except Exception:
        return None
    candidates = [record for record in records if record.nameID == name_id]
    candidates.sort(key=lambda record: (record.platformID != 3, record.langID not in (0x409, 0)))
    for record in candidates:
        try:
            value = record.toUnicode().strip()
            if value:
                return value
        except Exception:
            continue
    return None


def main(path):
    font = TTFont(path, lazy=False)
    os2 = font.get("OS/2")
    head = font.get("head")
    post = font.get("post")
    fvar = font.get("fvar")
    weight = getattr(os2, "usWeightClass", None)
    selection = getattr(os2, "fsSelection", 0)
    mac_style = getattr(head, "macStyle", 0)
    subfamily = name_value(font, 2)
    italic = bool((selection & 1) or (mac_style & 2) or (post and post.italicAngle) or (subfamily and ("italic" in subfamily.lower() or "oblique" in subfamily.lower())))
    result = {
        "status": "parsed",
        "family_name": name_value(font, 1),
        "subfamily_name": subfamily,
        "full_name": name_value(font, 4),
        "postscript_name": name_value(font, 6),
        "weight_class": weight,
        "is_italic": italic,
        "is_variable": bool(fvar),
        "glyph_count": len(font.getBestCmap() or {}),
        "formats": ["woff2"],
        "variation_axes": [
            {
                "tag": axis.axisTag,
                "min": axis.minValue,
                "default": axis.defaultValue,
                "max": axis.maxValue,
            }
            for axis in (fvar.axes if fvar else [])
        ],
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: parse-woff2-metadata.py <font.woff2>", file=sys.stderr)
        sys.exit(2)
    try:
        main(sys.argv[1])
    except Exception as error:
        print(json.dumps({"status": "parse_failed", "reason": str(error)}, ensure_ascii=False))
        sys.exit(1)
