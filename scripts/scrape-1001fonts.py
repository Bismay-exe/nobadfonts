#!/usr/bin/env python3
"""Scrape a 1001fonts.com font page -> JSON.

Usage:
  python scripts/scrape-1001fonts.py https://www.1001fonts.com/diomeca-font.html
  python scripts/scrape-1001fonts.py https://www.1001fonts.com/diomeca-font.html --output result.json

Outputs a JSON object with:
  url, name, author, author_url, images (direct avif links), download_zip
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

URL_PATTERN = re.compile(r"^https://www\.1001fonts\.com/[a-z0-9\-+]+-font\.html$")


def scrape(url: str) -> dict:
    if not URL_PATTERN.match(url):
        raise ValueError(f"Not a valid 1001fonts font page URL: {url}")

    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")

    # ── Font name ────────────────────────────────────────────────────
    h1 = soup.select_one("h1")
    font_name = None
    if h1:
        raw = h1.get_text(strip=True)
        # Strip trailing " Font" or " Font Family"
        font_name = re.sub(r"\s+Font(\s+Family)?$", "", raw, flags=re.IGNORECASE).strip()

    # ── Author ───────────────────────────────────────────────────────
    author_a = soup.select_one('a[href*="/users/"]:not(:has(img))') or soup.select_one('a[href*="/users/"]')
    author = author_a.get_text(strip=True) if author_a else None
    author_url = urljoin(url, author_a["href"]) if author_a else None

    # ── Download ZIP ─────────────────────────────────────────────────
    dl = soup.select_one('a[href*="/download/"][href$=".zip"]')
    download_zip = urljoin(url, dl["href"]) if dl else None

    # ── Gallery images ───────────────────────────────────────────────
    # The gallery wraps full-resolution images in <a href="...-original.avif">.
    # That href is the full-size image, which is why <img> scraping misses it.
    images = []
    for a in soup.select('a[href*="/img/illustrations/"]'):
        href = a.get("href", "")
        if href:
            images.append(urljoin(url, href))

    # Fallback: build from <img> thumbnails, upgrading small/large -> original
    if not images:
        for img in soup.select('img[src*="/img/illustrations/"]'):
            src = img.get("src", "")
            if src:
                full = re.sub(r"-(small|large)\.\w+$", "-original.avif", urljoin(url, src))
                images.append(full)

    # De-duplicate preserving order
    images = list(dict.fromkeys(images))

    return {
        "url": url,
        "name": font_name,
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

    # Exit with error if critical fields are missing
    if not (data.get("name") and data.get("download_zip")):
        print(
            "WARNING: Scrape incomplete — name or download_zip missing. "
            "Page layout may have changed.",
            file=sys.stderr,
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
