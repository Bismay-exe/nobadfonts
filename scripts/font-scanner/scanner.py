"""
scanner.py
==========
NoBadFonts — GitHub Font Discovery: Python Scanner Worker
Phase 3: Font Scanning

Responsibilities:
  1. Claim a bounded batch of queued font_scan_jobs (atomic, lease-based)
  2. Fetch the repository file tree from GitHub
  3. Detect font files, metadata files, and README
  4. Download and parse each font file with FontTools
  5. Check license files
  6. Run duplicate detection
  7. Upsert font_candidates into Supabase (one per font family)
  8. Mark jobs completed/failed
  9. Update github_font_repositories scan_status and commit SHA

Usage (GitHub Actions or local test):
  python scanner.py [--batch-size N] [--dry-run]

Environment variables (set in GitHub Actions secrets or .env.local):
  SUPABASE_URL            — Supabase project URL
  SUPABASE_INGEST_KEY     — Secret for the ingest Edge Function (NOT service-role key)
  GITHUB_TOKEN            — Fine-grained PAT with public repo read access
  WORKER_ID               — Optional; defaults to hostname + PID
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import os
import re
import socket
import sys
import time
from pathlib import Path
from typing import Any

import requests

# Load .env.local if present (local development)
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent / "../../.env.local")
except ImportError:
    pass

from extractor import extract_font_metadata, SUPPORTED_EXTENSIONS
from license_checker import check_license
from duplicate import check_duplicates

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("scanner")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SUPABASE_URL         = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_INGEST_KEY  = os.environ["SUPABASE_INGEST_KEY"]
GITHUB_TOKEN         = os.environ.get("GITHUB_TOKEN", "")
WORKER_ID            = os.environ.get("WORKER_ID", f"{socket.gethostname()}-{os.getpid()}")

DEFAULT_BATCH_SIZE   = 20
MAX_FONT_FILES_PER_REPO = 50    # Cap files to process per repo
MAX_FILE_SIZE_BYTES  = 5 * 1024 * 1024  # 5 MB
LEASE_MINUTES        = 30

# Font file extensions to look for
FONT_EXTENSIONS = {".ttf", ".otf", ".woff", ".woff2"}

# Metadata file names to look for
METADATA_FILENAMES = {"METADATA.pb", "fonts.json", "package.json"}

# ---------------------------------------------------------------------------
# Supabase REST client (thin wrapper)
# ---------------------------------------------------------------------------

class SupabaseREST:
    """Minimal Supabase REST API client for the scanner worker."""

    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "apikey":        key,
            "Authorization": f"Bearer {key}",
            "Content-Type":  "application/json",
            "Prefer":        "return=representation",
        })

    def from_(self, table: str):
        return _TableQuery(self.session, f"{self.url}/rest/v1/{table}")

    def rpc(self, fn: str, params: dict | None = None) -> Any:
        resp = self.session.post(
            f"{self.url}/rest/v1/rpc/{fn}",
            json=params or {},
        )
        resp.raise_for_status()
        return resp.json()


class _TableQuery:
    def __init__(self, session: requests.Session, base_url: str):
        self._session  = session
        self._base_url = base_url
        self._params: dict[str, str] = {}
        self._filters: list[str] = []

    def select(self, cols: str = "*"):
        self._params["select"] = cols
        return self

    def eq(self, col: str, val: Any):
        self._filters.append(f"{col}=eq.{val}")
        return self

    def ilike(self, col: str, val: str):
        self._filters.append(f"{col}=ilike.*{val}*")
        return self

    def execute(self) -> Any:
        url = self._base_url
        if self._filters:
            url += "?" + "&".join(self._filters)
        resp = self._session.get(url, params=self._params)
        resp.raise_for_status()

        class _Result:
            data: list = []
            error = None

        r = _Result()
        r.data = resp.json()
        return r

    def upsert(self, data: dict | list, on_conflict: str = "id") -> Any:
        resp = self._session.post(
            self._base_url,
            json=data,
            headers={"Prefer": f"resolution=merge-duplicates,return=representation,on_conflict={on_conflict}"},
        )
        resp.raise_for_status()
        return resp.json()

    def update(self, data: dict) -> "_TableQuery":
        self._update_data = data
        return self

    def execute_update(self) -> Any:
        url = self._base_url
        if self._filters:
            url += "?" + "&".join(self._filters)
        resp = self._session.patch(url, json=self._update_data)
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# GitHub API helpers
# ---------------------------------------------------------------------------

GITHUB_HEADERS: dict[str, str] = {
    "Accept":               "application/vnd.github+json",
    "User-Agent":           "NoBadFonts-Scanner/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
}
if GITHUB_TOKEN:
    GITHUB_HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"


def github_get(url: str, stream: bool = False) -> requests.Response:
    """GET from GitHub with retry on 429/5xx."""
    for attempt in range(4):
        resp = requests.get(url, headers=GITHUB_HEADERS, stream=stream, timeout=30)
        if resp.status_code == 429 or resp.status_code >= 500:
            retry_after = int(resp.headers.get("Retry-After", 0))
            wait = retry_after or min(2 ** attempt + 0.5, 30)
            logger.warning("GitHub %s, retrying in %.1fs", resp.status_code, wait)
            time.sleep(wait)
            continue
        return resp
    raise RuntimeError(f"GitHub GET failed after retries: {url}")


def fetch_text(url: str) -> str | None:
    """Fetch raw text from a URL (used by license_checker)."""
    try:
        resp = github_get(url)
        if resp.ok:
            return resp.text
    except Exception as exc:
        logger.debug("fetch_text error for %s: %s", url, exc)
    return None


def fetch_bytes_capped(url: str, max_bytes: int = MAX_FILE_SIZE_BYTES) -> bytes | None:
    """Fetch binary content up to max_bytes."""
    try:
        resp = github_get(url, stream=True)
        if not resp.ok:
            return None
        data = b""
        for chunk in resp.iter_content(chunk_size=65536):
            data += chunk
            if len(data) > max_bytes:
                logger.warning("File too large, truncating: %s", url)
                return None
        return data
    except Exception as exc:
        logger.debug("fetch_bytes error for %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Font family grouping
# ---------------------------------------------------------------------------

def group_by_family(font_files: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """
    Group font files by their detected family name.
    Files without an extracted family fall back to a name inferred from the path.
    """
    groups: dict[str, list[dict[str, Any]]] = {}
    for f in font_files:
        family = (
            f.get("meta", {}).get("typographic_family")
            or f.get("meta", {}).get("family_name")
            or _guess_family_from_path(f["path"])
        )
        if not family:
            family = "Unknown"
        groups.setdefault(family, []).append(f)
    return groups


def _guess_family_from_path(path: str) -> str:
    """Guess family name from font file path as fallback."""
    filename = Path(path).stem
    # Remove weight/style suffixes: -Bold, _Regular, -Italic, etc.
    name = re.sub(r"[-_](bold|regular|italic|medium|light|thin|black|condensed|expanded|semibold|extrabold|heavy|oblique|roman|book|demi|ultra|narrow|wide|variable).*", "", filename, flags=re.IGNORECASE)
    # Replace underscores and dashes with spaces
    name = re.sub(r"[-_]+", " ", name).strip()
    return name or filename


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def build_validation_warnings(
    font_files: list[dict[str, Any]],
    license_info: dict[str, Any],
    family_name: str,
    duplicate_info: dict[str, Any],
) -> tuple[str, list[dict[str, Any]]]:
    """Build validation status and warnings list."""
    warnings: list[dict[str, Any]] = []

    # License warnings
    ls = license_info.get("license_status")
    if ls == "missing":
        warnings.append({"code": "LICENSE_MISSING", "message": "No license file found.", "severity": "error"})
    elif ls == "uncertain":
        warnings.append({"code": "LICENSE_UNCERTAIN", "message": license_info.get("license_evidence", "License is uncertain."), "severity": "warning"})
    elif ls == "conflicting":
        warnings.append({"code": "LICENSE_CONFLICTING", "message": license_info.get("license_evidence", "Conflicting licenses."), "severity": "error"})

    # Extraction errors
    for f in font_files:
        err = f.get("meta", {}).get("extraction_error")
        if err:
            warnings.append({"code": "EXTRACTION_ERROR", "message": f"{f['path']}: {err}", "severity": "warning"})

    # Duplicate
    if duplicate_info.get("is_duplicate"):
        warnings.append({
            "code":     "DUPLICATE_DETECTED",
            "message":  duplicate_info.get("notes", "Potential duplicate detected."),
            "severity": "warning",
        })

    # Missing family name
    if not family_name or family_name == "Unknown":
        warnings.append({"code": "MISSING_FAMILY_NAME", "message": "Could not determine font family name.", "severity": "warning"})

    errors   = [w for w in warnings if w["severity"] == "error"]
    has_warn = len(warnings) > 0

    if errors:
        status = "warnings"   # Still show to admin, with visible flags
    elif has_warn:
        status = "warnings"
    else:
        status = "passed"

    return status, warnings


# ---------------------------------------------------------------------------
# Main scan function
# ---------------------------------------------------------------------------

def scan_repository(repo: dict[str, Any], supabase: SupabaseREST, dry_run: bool = False) -> bool:
    """
    Scan a single repository job.

    Returns True if scan succeeded (even if no font families found), False on fatal error.
    """
    owner          = repo["owner"]
    repo_name      = repo["repo_name"]
    default_branch = repo["default_branch"]
    html_url       = repo["html_url"]
    github_repo_id = repo["github_repo_id"]
    repo_internal_id = repo["id"]

    logger.info("Scanning %s/%s", owner, repo_name)

    # 1. Fetch repository tree (recursive, single call)
    tree_url = (
        f"https://api.github.com/repos/{owner}/{repo_name}"
        f"/git/trees/{default_branch}?recursive=1"
    )
    tree_resp = github_get(tree_url)
    if not tree_resp.ok:
        logger.error("Tree fetch failed: %s %s", tree_resp.status_code, repo["full_name"])
        return False

    tree_data  = tree_resp.json()
    tree_files = tree_data.get("tree", [])

    # 2. Detect font files
    font_file_entries = [
        f for f in tree_files
        if f.get("type") == "blob"
        and Path(f["path"]).suffix.lower() in FONT_EXTENSIONS
    ][:MAX_FONT_FILES_PER_REPO]

    if not font_file_entries:
        logger.info("No font files found in %s/%s — skipping", owner, repo_name)
        # Mark repo as no_fonts
        if not dry_run:
            _update_repo_status(supabase, repo_internal_id, "no_fonts", None, None)
        return True

    # 3. Fetch latest commit SHA
    commit_sha = tree_data.get("sha")

    # 4. Build raw URLs (pinned to commit SHA for stability)
    for entry in font_file_entries:
        raw_url = (
            f"https://raw.githubusercontent.com/{owner}/{repo_name}"
            f"/{default_branch}/{entry['path']}"
        )
        commit_pinned_url = (
            f"https://raw.githubusercontent.com/{owner}/{repo_name}"
            f"/{commit_sha}/{entry['path']}"
            if commit_sha else raw_url
        )
        entry["raw_url"]           = raw_url
        entry["commit_pinned_url"] = commit_pinned_url

    # 5. Download and parse each font file
    parsed_font_files: list[dict[str, Any]] = []

    for entry in font_file_entries:
        font_bytes = fetch_bytes_capped(entry["raw_url"])
        if not font_bytes:
            parsed_font_files.append({**entry, "meta": {"extraction_error": "Download failed or file too large"}})
            continue

        meta = extract_font_metadata(font_bytes, Path(entry["path"]).name)
        meta["file_hash"] = hashlib.sha256(font_bytes).hexdigest()
        parsed_font_files.append({**entry, "meta": meta})

    # 6. Check license (once per repository)
    license_info = check_license(
        tree_files     = tree_files,
        owner          = owner,
        repo_name      = repo_name,
        default_branch = default_branch,
        fetch_fn       = fetch_text,
    )

    # 7. Group font files by family
    family_groups = group_by_family(parsed_font_files)

    logger.info("Found %d font families in %s/%s", len(family_groups), owner, repo_name)

    # 8. Create one font_candidate per family
    candidates_created = 0

    for family_name, family_files in family_groups.items():
        # Pick the best metadata from the family's files (prefer non-error)
        best_meta: dict[str, Any] = {}
        for f in family_files:
            m = f.get("meta", {})
            if not m.get("extraction_error"):
                best_meta = m
                break
        if not best_meta and family_files:
            best_meta = family_files[0].get("meta", {})

        # 9. Duplicate detection
        ps_name = best_meta.get("postscript_name")
        dup_info = check_duplicates(
            candidate_family_name     = family_name,
            candidate_postscript_name = ps_name,
            repository_html_url       = html_url,
            github_repo_id            = github_repo_id,
            supabase_client           = supabase,
        )

        # 10. Build validation
        validation_status, validation_warnings = build_validation_warnings(
            font_files     = family_files,
            license_info   = license_info,
            family_name    = family_name,
            duplicate_info = dup_info,
        )

        # 11. Build file manifest
        file_manifest = [
            {
                "path":               f["path"],
                "format":             f.get("meta", {}).get("format"),
                "size_bytes":         f.get("meta", {}).get("file_size_bytes"),
                "raw_url":            f.get("raw_url"),
                "commit_pinned_url":  f.get("commit_pinned_url"),
                "file_hash":          f.get("meta", {}).get("file_hash"),
            }
            for f in family_files
        ]

        # 12. Build slug candidate
        slug_candidate = re.sub(r"[^a-z0-9]+", "-", family_name.lower()).strip("-")

        # 13. Determine candidate status
        candidate_status = "duplicate" if dup_info["is_duplicate"] else "needs_review"

        candidate = {
            "repository_id":           repo_internal_id,
            "family_name":             family_name,
            "slug_candidate":          slug_candidate,
            "description_extracted":   None,   # Can be enriched later (README extraction / AI)
            "designer_name":           best_meta.get("designer"),
            "foundry_name":            best_meta.get("manufacturer"),
            "official_url":            None,
            "repository_path":         _common_path_prefix(family_files),
            "font_metadata":           best_meta,
            "font_file_manifest":      file_manifest,
            "license_name":            license_info.get("license_name"),
            "license_identifier":      license_info.get("license_identifier"),
            "license_category":        license_info.get("license_category"),
            "license_text_url":        license_info.get("license_text_url"),
            "license_evidence":        license_info.get("license_evidence"),
            "license_status":          license_info.get("license_status", "not_checked"),
            "validation_status":       validation_status,
            "validation_warnings":     validation_warnings,
            "duplicate_of_font_id":    dup_info.get("duplicate_of_font_id"),
            "duplicate_of_candidate_id": dup_info.get("duplicate_of_candidate_id"),
            "status":                  candidate_status,
        }

        if not dry_run:
            try:
                supabase.from_("font_candidates").upsert(
                    candidate,
                    on_conflict="repository_id,slug_candidate",
                )
                candidates_created += 1
            except Exception as exc:
                logger.error("Failed to upsert candidate %s: %s", family_name, exc)

    # 14. Update repository record
    if not dry_run:
        _update_repo_status(supabase, repo_internal_id, "scanned", commit_sha, commit_sha)

    logger.info(
        "Finished %s/%s — %d families, %d candidates created",
        owner, repo_name, len(family_groups), candidates_created
    )
    return True


def _update_repo_status(
    supabase: SupabaseREST,
    repo_id: str,
    status: str,
    last_commit_sha: str | None,
    last_scanned_commit_sha: str | None,
) -> None:
    try:
        update_data: dict[str, Any] = {
            "scan_status": status,
            "last_scanned_at": _now_iso(),
        }
        if last_commit_sha:
            update_data["last_commit_sha"] = last_commit_sha
        if last_scanned_commit_sha:
            update_data["last_scanned_commit_sha"] = last_scanned_commit_sha

        resp = supabase.session.patch(
            f"{supabase.url}/rest/v1/github_font_repositories?id=eq.{repo_id}",
            json=update_data,
        )
        resp.raise_for_status()
    except Exception as exc:
        logger.warning("Failed to update repo status for %s: %s", repo_id, exc)


def _common_path_prefix(files: list[dict[str, Any]]) -> str:
    """Return the common directory prefix for a list of font files."""
    paths = [f["path"] for f in files if "path" in f]
    if not paths:
        return ""
    dirs = [str(Path(p).parent) for p in paths]
    common = os.path.commonprefix(dirs)
    return common.rstrip("/") if common != "." else ""


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="NoBadFonts Font Scanner Worker")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--dry-run", action="store_true", help="Don't write to Supabase")
    args = parser.parse_args()

    supabase = SupabaseREST(SUPABASE_URL, SUPABASE_INGEST_KEY)

    logger.info(
        "Worker %s starting — batch_size=%d, dry_run=%s",
        WORKER_ID, args.batch_size, args.dry_run
    )

    # Claim a batch of jobs atomically
    try:
        jobs = supabase.rpc("claim_scan_jobs", {
            "p_worker_id":     WORKER_ID,
            "p_batch_size":    args.batch_size,
            "p_lease_minutes": LEASE_MINUTES,
        })
    except Exception as exc:
        logger.error("Failed to claim jobs: %s", exc)
        sys.exit(1)

    if not jobs:
        logger.info("No queued jobs available — exiting.")
        sys.exit(0)

    logger.info("Claimed %d jobs", len(jobs))

    success_count = 0
    failure_count = 0

    for job in jobs:
        repo_id    = job["repository_id"]
        job_id     = job["id"]
        attempt    = job["attempt_count"]

        # Fetch full repo record
        try:
            resp = supabase.session.get(
                f"{supabase.url}/rest/v1/github_font_repositories?id=eq.{repo_id}",
                headers={"apikey": SUPABASE_INGEST_KEY, "Authorization": f"Bearer {SUPABASE_INGEST_KEY}"},
            )
            resp.raise_for_status()
            repos = resp.json()
            if not repos:
                raise ValueError(f"Repository {repo_id} not found")
            repo = repos[0]
        except Exception as exc:
            logger.error("Failed to load repo %s: %s", repo_id, exc)
            _mark_job_failed(supabase, job_id, str(exc))
            failure_count += 1
            continue

        # Update repo status to 'scanning'
        if not args.dry_run:
            _update_repo_status(supabase, repo_id, "scanning", None, None)

        try:
            ok = scan_repository(repo, supabase, dry_run=args.dry_run)
        except Exception as exc:
            logger.exception("Unexpected error scanning %s: %s", repo.get("full_name"), exc)
            ok = False
            error_msg = str(exc)
        else:
            error_msg = None

        if ok:
            _mark_job_completed(supabase, job_id)
            success_count += 1
        else:
            err = error_msg or "scan_repository returned False"
            _mark_job_failed(supabase, job_id, err)
            if not args.dry_run:
                _update_repo_status(supabase, repo_id, "failed", None, None)
            failure_count += 1

    logger.info(
        "Worker done — %d succeeded, %d failed out of %d jobs",
        success_count, failure_count, len(jobs)
    )

    if failure_count > 0:
        sys.exit(1)


def _mark_job_completed(supabase: SupabaseREST, job_id: str) -> None:
    try:
        supabase.session.patch(
            f"{supabase.url}/rest/v1/font_scan_jobs?id=eq.{job_id}",
            json={"status": "completed", "updated_at": _now_iso()},
            headers={"apikey": SUPABASE_INGEST_KEY, "Authorization": f"Bearer {SUPABASE_INGEST_KEY}"},
        )
    except Exception as exc:
        logger.warning("Failed to mark job %s completed: %s", job_id, exc)


def _mark_job_failed(supabase: SupabaseREST, job_id: str, error: str) -> None:
    try:
        supabase.session.patch(
            f"{supabase.url}/rest/v1/font_scan_jobs?id=eq.{job_id}",
            json={"status": "failed", "last_error": error[:1000], "updated_at": _now_iso()},
            headers={"apikey": SUPABASE_INGEST_KEY, "Authorization": f"Bearer {SUPABASE_INGEST_KEY}"},
        )
    except Exception as exc:
        logger.warning("Failed to mark job %s failed: %s", job_id, exc)


if __name__ == "__main__":
    main()
