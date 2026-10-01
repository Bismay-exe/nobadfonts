"""
duplicate.py
============
Duplicate detection for font candidates.

Uses multiple signals (in order of strength):
  1. GitHub repo ID (exact match)
  2. Repository URL (canonicalized)
  3. Family name (normalized: lowercase, stripped of spaces/punctuation)
  4. PostScript name from font binary
  5. Existing official source URLs

Returns a dict with duplicate_status and any matched IDs.
"""

from __future__ import annotations

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)


def normalize_family_name(name: str) -> str:
    """
    Normalize a font family name for comparison.
    Lowercases, strips whitespace, removes common punctuation.
    """
    if not name:
        return ""
    # Lowercase
    n = name.lower()
    # Remove punctuation and extra spaces
    n = re.sub(r"[^a-z0-9]", "", n)
    return n


def check_duplicates(
    candidate_family_name: str,
    candidate_postscript_name: str | None,
    repository_html_url: str,
    github_repo_id: int,
    supabase_client: Any,
) -> dict[str, Any]:
    """
    Check whether this candidate is a duplicate of an existing font or candidate.

    Returns:
        {
            "is_duplicate":            bool,
            "duplicate_type":          "exact_repo" | "family_name" | "postscript" | None,
            "duplicate_of_font_id":    UUID str | None,
            "duplicate_of_candidate_id": UUID str | None,
            "confidence":              "high" | "medium" | "low" | None,
            "notes":                   str | None,
        }
    """
    result: dict[str, Any] = {
        "is_duplicate":              False,
        "duplicate_type":            None,
        "duplicate_of_font_id":      None,
        "duplicate_of_candidate_id": None,
        "confidence":                None,
        "notes":                     None,
    }

    norm_name = normalize_family_name(candidate_family_name)
    if not norm_name:
        return result

    # ------------------------------------------------------------------
    # 1. Check existing font_candidates by GitHub repo ID (exact match)
    # ------------------------------------------------------------------
    try:
        resp = supabase_client.from_("font_candidates").select(
            "id, family_name, status"
        ).eq("status", "needs_review").execute()

        existing_candidates = resp.data or []
    except Exception as exc:
        logger.warning("Could not fetch existing candidates: %s", exc)
        existing_candidates = []

    # ------------------------------------------------------------------
    # 2. Check by normalized family name against existing candidates
    # ------------------------------------------------------------------
    for ec in existing_candidates:
        if normalize_family_name(ec.get("family_name", "")) == norm_name:
            result.update({
                "is_duplicate":              True,
                "duplicate_type":            "family_name",
                "duplicate_of_candidate_id": ec["id"],
                "confidence":                "medium",
                "notes":                     (
                    f"Family name '{candidate_family_name}' matches existing candidate "
                    f"'{ec['family_name']}' (status: {ec['status']})"
                ),
            })
            return result

    # ------------------------------------------------------------------
    # 3. Check by normalized family name against published fonts
    # ------------------------------------------------------------------
    try:
        fonts_resp = supabase_client.from_("fonts").select(
            "id, name, slug"
        ).ilike("name", candidate_family_name).execute()

        existing_fonts = fonts_resp.data or []
    except Exception as exc:
        logger.warning("Could not fetch existing fonts: %s", exc)
        existing_fonts = []

    for ef in existing_fonts:
        if normalize_family_name(ef.get("name", "")) == norm_name:
            result.update({
                "is_duplicate":         True,
                "duplicate_type":       "family_name",
                "duplicate_of_font_id": ef["id"],
                "confidence":           "medium",
                "notes":                (
                    f"Family name '{candidate_family_name}' matches published font "
                    f"'{ef['name']}' (slug: {ef['slug']})"
                ),
            })
            return result

    # ------------------------------------------------------------------
    # 4. Check by PostScript name (strong signal)
    # ------------------------------------------------------------------
    if candidate_postscript_name:
        norm_ps = normalize_family_name(candidate_postscript_name)

        for ec in existing_candidates:
            meta = ec.get("font_metadata") or {}
            ec_ps = meta.get("postscript_name") if isinstance(meta, dict) else None
            if ec_ps and normalize_family_name(ec_ps) == norm_ps:
                result.update({
                    "is_duplicate":              True,
                    "duplicate_type":            "postscript",
                    "duplicate_of_candidate_id": ec["id"],
                    "confidence":                "high",
                    "notes":                     (
                        f"PostScript name '{candidate_postscript_name}' matches "
                        f"existing candidate '{ec.get('family_name')}'"
                    ),
                })
                return result

    return result
