#!/usr/bin/env python3
"""Extract authoritative OpenType metadata for a batch of font files.

Input: JSON array of file paths on stdin.
Output: JSON object keyed by absolute file path.
This helper never writes font files or contacts external services.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont


def name_value(font: TTFont, ids: tuple[int, ...]) -> str | None:
    table = font.get("name")
    if table is None:
        return None
    records = []
    for record in table.names:
        if record.nameID not in ids:
            continue
        try:
            value = record.toUnicode().strip()
        except Exception:
            continue
        if not value:
            continue
        # Prefer Windows English records, then Unicode English, then any usable record.
        priority = (
            0 if record.platformID == 3 and record.langID == 0x0409 else
            1 if record.platformID == 0 and record.langID == 0 else
            2 if record.platformID == 3 else 3
        )
        records.append((priority, ids.index(record.nameID), value))
    if not records:
        return None
    records.sort(key=lambda row: (row[0], row[1]))
    return records[0][2]


def inspect(path_string: str) -> dict:
    path = Path(path_string).resolve()
    raw = path.read_bytes()
    result = {
        "path": str(path),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "size_bytes": len(raw),
        "family_name": None,
        "subfamily_name": None,
        "full_name": None,
        "postscript_name": None,
        "weight_class": None,
        "is_italic": None,
        "is_variable": False,
        "variation_axes": [],
        "parser_status": "parse_failed",
        "parser_error": None,
    }
    font = None
    try:
        font = TTFont(str(path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
        result.update({
            "family_name": name_value(font, (16, 1)),
            "subfamily_name": name_value(font, (17, 2)),
            "full_name": name_value(font, (4,)),
            "postscript_name": name_value(font, (6,)),
        })
        os2 = font.get("OS/2")
        if os2 is not None:
            result["weight_class"] = int(os2.usWeightClass)
            result["is_italic"] = bool(os2.fsSelection & 0x01)
        post = font.get("post")
        if result["is_italic"] is None and post is not None:
            result["is_italic"] = bool(post.italicAngle)
        if result["is_italic"] is None:
            subfamily = (result["subfamily_name"] or "").casefold()
            result["is_italic"] = "italic" in subfamily or "oblique" in subfamily
        fvar = font.get("fvar")
        if fvar is not None:
            axes = []
            for axis in fvar.axes:
                axes.append({
                    "tag": str(axis.axisTag),
                    "min": float(axis.minValue),
                    "default": float(axis.defaultValue),
                    "max": float(axis.maxValue),
                })
            result["variation_axes"] = axes
            result["is_variable"] = bool(axes)
        result["parser_status"] = "parsed" if result["family_name"] and result["subfamily_name"] else "incomplete"
    except Exception as error:
        result["parser_error"] = f"{type(error).__name__}: {error}"[:500]
    finally:
        if font is not None:
            font.close()
    return result


def main() -> int:
    paths = json.load(sys.stdin)
    if not isinstance(paths, list) or not all(isinstance(item, str) for item in paths):
        raise ValueError("stdin must contain a JSON array of file path strings")
    output = {}
    for item in paths:
        output[str(Path(item).resolve())] = inspect(item)
    json.dump(output, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Font metadata extraction failed: {error}", file=sys.stderr)
        raise SystemExit(1)
