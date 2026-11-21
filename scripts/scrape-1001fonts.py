#!/usr/bin/env python3
"""Scrape a 1001fonts.com font page -> JSON.

Usage:
  python scripts/scrape-1001fonts.py https://www.1001fonts.com/diomeca-font.html
  python scripts/scrape-1001fonts.py https://www.1001fonts.com/diomeca-font.html --output result.json

Outputs a JSON object with:
  url, name, designer, author, author_url, images (direct full-size image links), download_zip
"""
import json
import re
import sys
import argparse
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print(json.dumps({"error": "Missing dependencies: pip install requests beautifulsoup4"}), file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?1001fonts\.com/([a-zA-Z0-9_-]+-font\.html)(?:[?#].*)?$",
    re.IGNORECASE,
)


def normalize_1001fonts_url(url: str) -> str:
    m = URL_PATTERN.match(url.strip())
    if not m:
        raise ValueError(f"Not a valid 1001fonts font page URL: {url}")
    return f"https://www.1001fonts.com/{m.group(1).lower()}"


def scrape(url: str) -> dict:
    normalized_url = normalize_1001fonts_url(url)

    res = requests.get(normalized_url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")

    # ── Font name ────────────────────────────────────────────────────
    h1 = soup.select_one("h1")
    font_name = None
    if h1:
        raw = h1.get_text(strip=True)
        # Strip trailing " Font" or " Font Family"
        font_name = re.sub(r"\s+Font(\s+Family)?$", "", raw, flags=re.IGNORECASE).strip()

    # ── Author / Designer ────────────────────────────────────────────
    author_a = soup.select_one('a[href*="/users/"]:not(:has(img))') or soup.select_one('a[href*="/users/"]')
    author = None
    author_url = None
    if author_a:
        raw_author = author_a.get_text(strip=True)
        # Strip leading "by " if present
        author = re.sub(r"^by\s+", "", raw_author, flags=re.IGNORECASE).strip() or None
        href = author_a.get("href", "")
        if href:
            author_url = urljoin(normalized_url, href)

    # ── Download ZIP ─────────────────────────────────────────────────
    dl = (
        soup.select_one('a[href*="/download/"][href$=".zip"]')
        or soup.select_one('a[href*="/download/"]')
        or soup.select_one("a.download-button")
    )
    download_zip = None
    if dl and dl.get("href"):
        download_zip = urljoin(normalized_url, dl["href"])

    # ── Gallery images ───────────────────────────────────────────────
    # The gallery wraps full-resolution images in <a href="...-original.avif">.
    # We inspect all anchor links inside the illustrations/gallery area first.
    images = []
    for a in soup.select('a[href*="/img/illustrations/"], a[href*="/illustrations/"], a.gallery-item, a[data-full-img]'):
        href = a.get("href") or a.get("data-full-img") or ""
        if href and not href.startswith("#"):
            full_img_url = urljoin(normalized_url, href)
            if re.search(r"\.(?:avif|webp|png|jpe?g|gif)(?:\?.*)?$", full_img_url, re.IGNORECASE):
                images.append(full_img_url)

    # Fallback: inspect <img> elements, upgrading small/large -> original
    if not images:
        for img in soup.select('img[src*="/img/illustrations/"], img[src*="/illustrations/"]'):
            src = img.get("src", "")
            if src:
                full = re.sub(r"-(small|large)\.\w+$", "-original.avif", urljoin(normalized_url, src))
                images.append(full)

    # De-duplicate preserving order
    images = list(dict.fromkeys(images))

    return {
        "url": normalized_url,
        "name": font_name,
        "designer": author,
        "author": author,
        "author_url": author_url,
        "images": images,
        "download_zip": download_zip,
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape 1001fonts.com font page metadata")
    parser.add_argument("url", help="1001fonts font page URL")
    parser.add_argument("--output", "-o", help="Write JSON to this file instead of stdout")
    args = parser.parse_args()

    try:
        data = scrape(args.url)
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)

    json_str = json.dumps(data, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_str)
        print(f"Written to {args.output}", file=sys.stderr)
    else:
        print(json_str)

    # Exit with warning if critical fields are missing
    if not (data.get("name") and data.get("download_zip")):
        print(
            "WARNING: Scrape incomplete — name or download_zip missing. "
            "Page layout may have changed.",
            file=sys.stderr,
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
