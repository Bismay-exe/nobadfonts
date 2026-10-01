"""
license_checker.py
==================
Detects, fetches, and classifies license files from a GitHub repository.

Returns a structured dict with:
  - license_name:       Human-readable license name
  - license_identifier: SPDX identifier (when matched)
  - license_category:   open | commercial | unknown | custom
  - license_status:     verified | uncertain | missing | conflicting
  - license_text_url:   URL to the raw license file
  - license_evidence:   Short evidence snippet
"""

from __future__ import annotations

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Known license patterns (SPDX id → human name + category)
# ---------------------------------------------------------------------------

KNOWN_LICENSES: dict[str, dict[str, str]] = {
    # Open / Free
    "OFL-1.1":          {"name": "SIL Open Font License 1.1", "category": "open"},
    "OFL-1.0":          {"name": "SIL Open Font License 1.0", "category": "open"},
    "MIT":              {"name": "MIT License",                "category": "open"},
    "Apache-2.0":       {"name": "Apache License 2.0",        "category": "open"},
    "GPL-3.0":          {"name": "GNU GPL v3",                 "category": "open"},
    "GPL-2.0":          {"name": "GNU GPL v2",                 "category": "open"},
    "LGPL-3.0":         {"name": "GNU LGPL v3",               "category": "open"},
    "CC0-1.0":          {"name": "Creative Commons Zero",      "category": "open"},
    "CC-BY-4.0":        {"name": "CC BY 4.0",                 "category": "open"},
    "CC-BY-SA-4.0":     {"name": "CC BY-SA 4.0",             "category": "open"},
    "Bitstream Vera":   {"name": "Bitstream Vera",             "category": "open"},
    "Ubuntu Font":      {"name": "Ubuntu Font Licence",        "category": "open"},
    # Commercial / Restricted
    "COMMERCIAL":       {"name": "Commercial license",         "category": "commercial"},
    "PROPRIETARY":      {"name": "Proprietary",                "category": "commercial"},
}

# Regex patterns to match in license text
LICENSE_TEXT_PATTERNS: list[tuple[str, str]] = [
    (r"SIL OPEN FONT LICENSE.*?Version 1\.1",        "OFL-1.1"),
    (r"SIL OPEN FONT LICENSE.*?Version 1\.0",        "OFL-1.0"),
    (r"Permission is hereby granted.*?MIT",          "MIT"),
    (r"Apache License.*?Version 2\.0",               "Apache-2.0"),
    (r"GNU GENERAL PUBLIC LICENSE.*?Version 3",      "GPL-3.0"),
    (r"GNU GENERAL PUBLIC LICENSE.*?Version 2",      "GPL-2.0"),
    (r"GNU LESSER GENERAL PUBLIC LICENSE.*?Version 3","LGPL-3.0"),
    (r"Creative Commons.*?Zero",                     "CC0-1.0"),
    (r"Creative Commons.*?Attribution 4\.0",         "CC-BY-4.0"),
    (r"Bitstream Vera",                              "Bitstream Vera"),
    (r"Ubuntu Font Licence",                         "Ubuntu Font"),
    (r"All rights reserved",                         "COMMERCIAL"),
    (r"proprietary",                                 "PROPRIETARY"),
]

# Common license file names to look for in the repo tree
LICENSE_FILENAMES = {
    "license", "licence", "license.txt", "licence.txt",
    "license.md", "licence.md", "ofl.txt", "ofl.md",
    "copying", "copying.txt", "copying.md",
    "license-ofl.txt", "license-mit.txt",
}


def check_license(
    tree_files: list[dict[str, Any]],
    owner: str,
    repo_name: str,
    default_branch: str,
    fetch_fn,  # callable(url: str) -> str | None
) -> dict[str, Any]:
    """
    Check license for a repository.

    Args:
        tree_files:     List of file entries from GitHub tree API
                        [{path, type, sha, url, ...}]
        owner:          Repository owner
        repo_name:      Repository name
        default_branch: Default branch name
        fetch_fn:       Function that fetches URL text (handles auth/rate-limits)

    Returns:
        dict with license fields
    """
    result: dict[str, Any] = {
        "license_name":       None,
        "license_identifier": None,
        "license_category":   None,
        "license_status":     "missing",
        "license_text_url":   None,
        "license_evidence":   None,
    }

    # Find license files in the tree
    license_files = [
        f for f in tree_files
        if f.get("type") == "blob"
        and f["path"].split("/")[-1].lower().rstrip(".") in LICENSE_FILENAMES
        or f["path"].lower() in LICENSE_FILENAMES
        or any(
            f["path"].lower().endswith("/" + lf) for lf in LICENSE_FILENAMES
        )
    ]

    # Prefer root-level license files
    root_licenses = [f for f in license_files if "/" not in f["path"]]
    candidates = root_licenses or license_files

    if not candidates:
        result["license_status"] = "missing"
        result["license_evidence"] = "No license file found in repository tree."
        return result

    # Fetch and classify each license file
    matched: list[dict[str, Any]] = []

    for file_entry in candidates[:3]:  # check up to 3 license files
        path = file_entry["path"]
        raw_url = (
            f"https://raw.githubusercontent.com/{owner}/{repo_name}"
            f"/{default_branch}/{path}"
        )

        text = fetch_fn(raw_url)
        if not text:
            continue

        identifier = _classify_license_text(text)
        if identifier:
            info = KNOWN_LICENSES.get(identifier, {})
            matched.append({
                "identifier": identifier,
                "name":       info.get("name", identifier),
                "category":   info.get("category", "unknown"),
                "url":        raw_url,
                "path":       path,
                "snippet":    _extract_evidence_snippet(text, identifier),
            })

    if not matched:
        result["license_status"]  = "uncertain"
        result["license_evidence"] = (
            f"Found {len(candidates)} license file(s) but could not classify: "
            + ", ".join(c["path"] for c in candidates[:3])
        )
        result["license_text_url"] = (
            f"https://raw.githubusercontent.com/{owner}/{repo_name}"
            f"/{default_branch}/{candidates[0]['path']}"
        )
        return result

    if len(set(m["identifier"] for m in matched)) > 1:
        # Multiple different licenses found
        result["license_status"]    = "conflicting"
        result["license_identifier"] = matched[0]["identifier"]
        result["license_name"]      = matched[0]["name"]
        result["license_category"]  = "unknown"
        result["license_text_url"]  = matched[0]["url"]
        result["license_evidence"]  = (
            "Conflicting licenses found: "
            + ", ".join(set(m["identifier"] for m in matched))
        )
        return result

    # Single clear match
    m = matched[0]
    result["license_status"]    = "verified"
    result["license_identifier"] = m["identifier"]
    result["license_name"]      = m["name"]
    result["license_category"]  = m["category"]
    result["license_text_url"]  = m["url"]
    result["license_evidence"]  = m["snippet"]

    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _classify_license_text(text: str) -> str | None:
    """Return the SPDX identifier matched in license text, or None."""
    text_upper = text.upper()[:4000]  # Check first 4KB

    for pattern, identifier in LICENSE_TEXT_PATTERNS:
        if re.search(pattern, text_upper, re.IGNORECASE | re.DOTALL):
            return identifier

    return None


def _extract_evidence_snippet(text: str, identifier: str) -> str:
    """Extract a short, human-readable evidence snippet from license text."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    # Return first 2 non-empty lines as evidence
    snippet = " | ".join(lines[:2])
    return snippet[:300] if snippet else f"Matched {identifier}"


def is_likely_open_license(license_identifier: str | None) -> bool:
    """Quick check: is this identifier a known open license?"""
    if not license_identifier:
        return False
    info = KNOWN_LICENSES.get(license_identifier, {})
    return info.get("category") == "open"
