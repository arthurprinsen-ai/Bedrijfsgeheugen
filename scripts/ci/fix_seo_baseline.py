#!/usr/bin/env python3
"""One-shot, idempotent SEO baseline repair.

This script deliberately performs exact, narrow text mutations against complete
files checked out by Git. It exists to avoid destructive whole-file updates
from partial API reads.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_once(path: Path, old: str, new: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return False
    if old not in text:
        raise SystemExit(f"Expected marker not found in {path}: {old[:100]!r}")
    if text.count(old) != 1:
        raise SystemExit(f"Expected exactly one marker in {path}, found {text.count(old)}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    return True


changed = []

# The legacy blog URL already 301s and canonicals to /afas-koppeling; it must
# not compete in the XML sitemap.
sitemap = ROOT / "sitemap.xml"
text = sitemap.read_text(encoding="utf-8")
legacy = '  <url><loc>https://www.bedrijfsgeheugen.nl/blog/afas-koppeling/</loc><lastmod>2026-08-16</lastmod></url>\n'
if legacy in text:
    text = text.replace(legacy, "", 1)
    changed.append("sitemap: remove legacy AFAS blog alias")

# Give all current public landing pages an explicit factual lastmod baseline.
for url in (
    "https://www.bedrijfsgeheugen.nl/bedrijfsprocessen-automatiseren",
    "https://www.bedrijfsgeheugen.nl/afas-pocket-koppelen",
    "https://www.bedrijfsgeheugen.nl/kennisverlies-vergrijzing-mkb",
):
    bare = f"<url><loc>{url}</loc><changefreq>monthly</changefreq>"
    enriched = f"<url><loc>{url}</loc><lastmod>2026-08-31</lastmod><changefreq>monthly</changefreq>"
    if bare in text:
        text = text.replace(bare, enriched, 1)
        changed.append(f"sitemap: add lastmod {url}")
sitemap.write_text(text, encoding="utf-8")

# Complete Open Graph metadata for the conversion-critical self-scan page.
selfscan = ROOT / "zelfscan.html"
marker = '<meta property="og:title" content="Gratis zelfscan — waar lekt jouw kennis?">\n<meta property="og:type" content="website">'
replacement = '<meta property="og:title" content="Gratis zelfscan — waar lekt jouw kennis?">\n<meta property="og:description" content="5 klikvragen, 2 minuten, direct je score. Ontdek waar jouw bedrijf kwetsbaar is: offertes, planning, klantkennis en systemen. Gratis, zonder verplichtingen.">\n<meta property="og:url" content="https://www.bedrijfsgeheugen.nl/zelfscan">\n<meta property="og:type" content="website">'
if replacement not in selfscan.read_text(encoding="utf-8"):
    if replace_once(selfscan, marker, replacement):
        changed.append("zelfscan: add og:description + og:url")

print("SEO baseline patch complete")
for item in changed:
    print(f"- {item}")
