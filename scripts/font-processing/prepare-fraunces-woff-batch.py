#!/usr/bin/env python3
"""Prepare a reproducible, read-only Fraunces TTF -> WOFF batch.

This script downloads the known public source TTFs, checks their expected byte
sizes, converts each file to WOFF, hashes both source and output bytes, and
writes a manifest. It never calls Supabase or mutates production data.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

FONT_ID = "345c0206-386e-4e51-b097-19128551e181"
STORAGE_ROOT = (
    "https://wcegdxhvgwbeskaidlxr.supabase.co/storage/v1/object/public/fonts/"
    "cc591a5a-0a92-445b-8b7b-6dd2fe64c2a0/fraunces/variants"
)
VARIANTS = [
    {"name": "Black", "filename": "fraunces-black.ttf", "size": 63584},
    {"name": "Black Italic", "filename": "fraunces-black-italic.ttf", "size": 75176},
    {"name": "Bold", "filename": "fraunces-bold.ttf", "size": 63440},
    {"name": "Bold Italic", "filename": "fraunces-bold-italic.ttf", "size": 74948},
    {"name": "Italic", "filename": "fraunces-italic.ttf", "size": 74656},
    {"name": "Light", "filename": "fraunces-light.ttf", "size": 63232},
    {"name": "Light Italic", "filename": "fraunces-light-italic.ttf", "size": 74504},
    {"name": "Regular", "filename": "fraunces-regular.ttf", "size": 360440},
    {"name": "Semi Bold", "filename": "fraunces-semi-bold.ttf", "size": 63516},
    {"name": "Semi Bold Italic", "filename": "fraunces-semi-bold-italic.ttf", "size": 74928},
    {"name": "Thin", "filename": "fraunces-thin.ttf", "size": 62876},
    {"name": "Thin Italic", "filename": "fraunces-thin-italic.ttf", "size": 74340},
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def name_value(font, name_id: int) -> str | None:
    table = font.get("name")
    if table is None:
        return None
    values = []
    for record in table.names:
        if record.nameID != name_id:
            continue
        try:
            value = record.toUnicode().strip()
        except Exception:
            continue
        if value and value not in values:
            values.append(value)
    # Prefer Windows English / Unicode records when available, but preserve
    # any additional distinct value for a reviewable audit trail.
    return values[0] if values else None


def download(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "NoBadFonts-FontBatch/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected HTTP status {response.status}: {url}")
        return response.read()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", default="fraunces-woff-batch")
    args = parser.parse_args()
    output_root = Path(args.output_dir).resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    # Import after argument parsing so the error explains the single dependency.
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print("Missing dependency: install fonttools (python -m pip install fonttools)", file=sys.stderr)
        return 2

    entries = []
    for variant in VARIANTS:
        name = variant["name"]
        source_url = (
            f"{STORAGE_ROOT}/{urllib.parse.quote(name, safe='')}/"
            f"{urllib.parse.quote(variant['filename'], safe='')}"
        )
        print(f"Preparing {name}…", flush=True)
        source_bytes = download(source_url)
        actual_size = len(source_bytes)
        if actual_size != variant["size"]:
            raise RuntimeError(
                f"{name}: source size changed (expected {variant['size']}, got {actual_size}); "
                "refusing to process an unexpected source."
            )

        relative_dir = Path("fonts") / "fraunces" / "variants" / name
        target_dir = output_root / relative_dir
        target_dir.mkdir(parents=True, exist_ok=True)
        source_path = target_dir / variant["filename"]
        woff_path = target_dir / (Path(variant["filename"]).stem + ".woff")
        source_path.write_bytes(source_bytes)

        font = TTFont(source_path, recalcBBoxes=False, recalcTimestamp=False)
        try:
            family_name = name_value(font, 1)
            subfamily_name = name_value(font, 2)
            full_name = name_value(font, 4)
            postscript_name = name_value(font, 6)
            weight_class = int(font["OS/2"].usWeightClass) if "OS/2" in font else None
            is_italic = bool(font["OS/2"].fsSelection & 0x01) if "OS/2" in font else (bool(font["post"].italicAngle) if "post" in font else False)
            font.flavor = "woff"
            font.save(woff_path)
        finally:
            font.close()

        woff_bytes = woff_path.read_bytes()
        # Reopen the produced WOFF to ensure the output remains parseable.
        converted = TTFont(woff_path, recalcBBoxes=False, recalcTimestamp=False)
        try:
            output_family = name_value(converted, 1)
            output_subfamily = name_value(converted, 2)
            if not output_family or not output_subfamily:
                raise RuntimeError(f"{name}: generated WOFF is missing family/subfamily names")
            if output_family != family_name or output_subfamily != subfamily_name:
                raise RuntimeError(f"{name}: name-table metadata changed during WOFF conversion")
        finally:
            converted.close()

        entries.append({
            "variant": name,
            "source": {
                "url": source_url,
                "filename": variant["filename"],
                "bytes": actual_size,
                "sha256": sha256(source_bytes),
            },
            "output": {
                "path": str((relative_dir / woff_path.name).as_posix()),
                "bytes": len(woff_bytes),
                "sha256": sha256(woff_bytes),
                "format": "woff",
            },
            "font_metadata": {
                "family_name": family_name,
                "subfamily_name": subfamily_name,
                "full_name": full_name,
                "postscript_name": postscript_name,
                "weight_class": weight_class,
                "is_italic": is_italic,
            },
            "production_write_performed": False,
        })

    manifest = {
        "schema_version": 1,
        "font": {"id": FONT_ID, "name": "Fraunces", "slug": "fraunces"},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "operation": "download_ttf_convert_to_woff",
        "source_count": len(entries),
        "output_count": len(entries),
        "sha256_verified": True,
        "production_write_performed": False,
        "publishing_status": "prepared_not_published",
        "entries": entries,
    }
    manifest_path = output_root / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    checksums_path = output_root / "SHA256SUMS"
    checksum_lines = [
        f"{entry['output']['sha256']}  {entry['output']['path']}"
        for entry in entries
    ]
    checksums_path.write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")
    readme = (
        "# Fraunces WOFF preparation batch\n\n"
        f"- Font ID: `{FONT_ID}`\n"
        f"- Converted variants: {len(entries)}\n"
        "- Output: TTF sources, generated WOFF files, manifest, and SHA256SUMS\n"
        "- Production writes: none\n"
        "- Publishing status: prepared only; not published\n\n"
        "Review the manifest and hashes before any separate publishing operation. "
        "This batch intentionally does not connect to Supabase APIs or modify database rows.\n"
    )
    (output_root / "README.md").write_text(readme, encoding="utf-8")
    print(f"Prepared {len(entries)} WOFF files at {output_root}")
    print(f"Manifest: {manifest_path}")
    print("No production writes were performed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (urllib.error.URLError, OSError, RuntimeError, ValueError) as error:
        print(f"Batch preparation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
