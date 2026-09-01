#!/usr/bin/env python3
"""Fail-closed technical/content SEO contract for generated blog candidates.

This gate is deterministic and intentionally does not call external/paid APIs.
DataForSEO/GSC opportunity evidence is selected upstream; this script proves that
what is being released is technically indexable, internally connected and able
to route qualified traffic toward a conversion step.
"""
from __future__ import annotations

import html as html_lib
import json
import pathlib
import re
import subprocess
import sys
from urllib.parse import urlparse

BASE = "https://www.bedrijfsgeheugen.nl"


def fail(message: str) -> None:
    print(f"::error::{message}", file=sys.stderr)
    raise SystemExit(1)


def text_content(value: str) -> str:
    value = re.sub(r"<script\b.*?</script>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<style\b.*?</style>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html_lib.unescape(value)).strip()


def attr(tag: str, name: str) -> str:
    m = re.search(rf"\b{re.escape(name)}\s*=\s*['\"]([^'\"]+)['\"]", tag, re.I)
    return html_lib.unescape(m.group(1)).strip() if m else ""


def meta(text: str, *, name: str | None = None, prop: str | None = None) -> list[str]:
    out: list[str] = []
    for tag in re.findall(r"<meta\b[^>]*>", text, re.I):
        if name and attr(tag, "name").lower() == name.lower():
            out.append(attr(tag, "content"))
        if prop and attr(tag, "property").lower() == prop.lower():
            out.append(attr(tag, "content"))
    return out


def significant_tokens(value: str) -> list[str]:
    stop = {"voor", "van", "het", "een", "met", "naar", "and", "the", "bedrijf", "bedrijven"}
    return [x for x in re.findall(r"[a-z0-9]+", value.lower()) if len(x) >= 4 and x not in stop]


def changed_article() -> pathlib.Path:
    tracked = subprocess.check_output(["git", "diff", "--name-only"], text=True).splitlines()
    untracked = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard"], text=True).splitlines()
    changed = sorted(set(tracked + untracked))
    articles = [p for p in changed if re.fullmatch(r"blog/[a-z0-9-]+/index\.html", p)]
    if len(articles) != 1:
        fail(f"SEO_GATE_REQUIRES_EXACTLY_ONE_ARTICLE: {articles}; changed={changed}")
    return pathlib.Path(articles[0])


def main() -> None:
    article = changed_article()
    text = article.read_text(encoding="utf-8")
    slug = article.parent.name
    canonical_expected = f"{BASE}/blog/{slug}/"

    if not re.search(r"<!doctype\s+html", text, re.I):
        fail("TECH_SEO_DOCTYPE_MISSING")
    html_tag = re.search(r"<html\b[^>]*>", text, re.I)
    if not html_tag or not attr(html_tag.group(0), "lang").lower().startswith("nl"):
        fail("TECH_SEO_HTML_LANG_NL_REQUIRED")
    if not re.search(r"<meta\b[^>]*charset=['\"]?utf-8", text, re.I):
        fail("TECH_SEO_UTF8_REQUIRED")
    viewport = meta(text, name="viewport")
    if len(viewport) != 1 or "width=device-width" not in viewport[0].lower():
        fail("TECH_SEO_VIEWPORT_REQUIRED")

    titles = [html_lib.unescape(x).strip() for x in re.findall(r"<title>(.*?)</title>", text, re.I | re.S)]
    if len(titles) != 1 or not 30 <= len(text_content(titles[0])) <= 65:
        fail(f"TECH_SEO_TITLE_LENGTH_30_65_REQUIRED:{titles}")
    title = text_content(titles[0])

    descriptions = meta(text, name="description")
    if len(descriptions) != 1 or not 120 <= len(descriptions[0]) <= 160:
        fail(f"TECH_SEO_META_DESCRIPTION_LENGTH_120_160_REQUIRED:{[len(x) for x in descriptions]}")

    robots = meta(text, name="robots")
    if len(robots) != 1:
        fail("TECH_SEO_EXACT_ONE_ROBOTS_META_REQUIRED")
    robots_norm = robots[0].lower().replace(" ", "")
    if "noindex" in robots_norm or "nofollow" in robots_norm or "index" not in robots_norm or "follow" not in robots_norm:
        fail(f"TECH_SEO_INDEX_FOLLOW_REQUIRED:{robots[0]}")

    canonicals = re.findall(r"<link\b[^>]*rel=['\"]canonical['\"][^>]*href=['\"]([^'\"]+)['\"][^>]*>", text, re.I)
    if len(canonicals) != 1 or html_lib.unescape(canonicals[0]) != canonical_expected:
        fail(f"TECH_SEO_CANONICAL_MISMATCH: expected={canonical_expected}; found={canonicals}")

    keyword_meta = meta(text, name="bg-zoekwoord")
    if len(keyword_meta) != 1 or not keyword_meta[0].strip():
        fail("SEO_PRIMARY_KEYWORD_REQUIRED")
    keyword = keyword_meta[0].strip()
    kw_tokens = significant_tokens(keyword)
    if not kw_tokens:
        fail("SEO_PRIMARY_KEYWORD_TOKENS_EMPTY")

    h1s = re.findall(r"<h1\b[^>]*>(.*?)</h1>", text, re.I | re.S)
    if len(h1s) != 1:
        fail(f"TECH_SEO_EXACT_ONE_H1_REQUIRED:{len(h1s)}")
    h1 = text_content(h1s[0]).lower()
    if sum(t in h1 for t in kw_tokens) < max(1, min(2, len(kw_tokens))):
        fail(f"SEO_H1_DOES_NOT_SUPPORT_PRIMARY_KEYWORD:{keyword}")
    if sum(t in title.lower() for t in kw_tokens) < max(1, min(2, len(kw_tokens))):
        fail(f"SEO_TITLE_DOES_NOT_SUPPORT_PRIMARY_KEYWORD:{keyword}")

    main_match = re.search(r"<main\b[^>]*>(.*?)</main>", text, re.I | re.S)
    if not main_match:
        fail("TECH_SEO_MAIN_REQUIRED")
    main_html = main_match.group(1)
    main_plain = text_content(main_html)
    words = re.findall(r"\b[\wÀ-ÿ'-]+\b", main_plain)
    if len(words) < 700:
        fail(f"SEO_THIN_CONTENT_LT_700_WORDS:{len(words)}")
    first_100 = " ".join(words[:100]).lower()
    if sum(t in first_100 for t in kw_tokens) < 1:
        fail(f"SEO_PRIMARY_KEYWORD_NOT_IN_FIRST_100_WORDS:{keyword}")
    if len(re.findall(r"<h2\b", main_html, re.I)) < 2:
        fail("SEO_AT_LEAST_TWO_H2_REQUIRED")

    internal: list[tuple[str, str]] = []
    bad_anchor = re.compile(r"^(klik hier|lees meer|hier)$", re.I)
    for m in re.finditer(r"<a\b([^>]*)>(.*?)</a>", main_html, re.I | re.S):
        tag = m.group(0)
        href = attr(tag, "href")
        anchor = text_content(m.group(2))
        if bad_anchor.fullmatch(anchor.strip()):
            fail(f"SEO_DESCRIPTIVE_ANCHOR_REQUIRED:{anchor}")
        if href.startswith("/") or href.startswith(BASE):
            internal.append((href, anchor))
    if len(internal) < 2:
        fail(f"SEO_AT_LEAST_TWO_INTERNAL_LINKS_REQUIRED:{len(internal)}")
    if not any("/frisse-blik" in href for href, _ in internal):
        fail("SEO_CONVERSION_LINK_TO_FRISSE_BLIK_REQUIRED")
    if not any("/blog/" in href and href.rstrip("/") != canonical_expected.rstrip("/") for href, _ in internal):
        fail("SEO_CONTEXTUAL_INTERNAL_BLOG_LINK_REQUIRED")

    for tag in re.findall(r"<img\b[^>]*>", text, re.I):
        if not attr(tag, "alt"):
            fail("TECH_SEO_IMAGE_ALT_REQUIRED")
        if not attr(tag, "width") or not attr(tag, "height"):
            fail("TECH_SEO_IMAGE_DIMENSIONS_REQUIRED")

    required_og = {
        "og:type": "article",
        "og:title": title,
        "og:description": descriptions[0],
        "og:url": canonical_expected,
    }
    for prop, expected in required_og.items():
        values = meta(text, prop=prop)
        if len(values) != 1:
            fail(f"TECH_SEO_{prop.upper().replace(':','_')}_REQUIRED")
        if prop in {"og:type", "og:url"} and values[0] != expected:
            fail(f"TECH_SEO_{prop.upper().replace(':','_')}_MISMATCH:{values[0]}")

    ld_blocks = re.findall(r"<script\b[^>]*type=['\"]application/ld\+json['\"][^>]*>(.*?)</script>", text, re.I | re.S)
    if len(ld_blocks) != 1:
        fail(f"TECH_SEO_EXACT_ONE_JSONLD_BLOCK_REQUIRED:{len(ld_blocks)}")
    try:
        ld = json.loads(ld_blocks[0])
    except Exception as exc:
        fail(f"TECH_SEO_JSONLD_INVALID:{exc}")
    graph = ld.get("@graph", []) if isinstance(ld, dict) else []
    posting = next((x for x in graph if x.get("@type") in {"BlogPosting", "Article"}), None)
    breadcrumb = next((x for x in graph if x.get("@type") == "BreadcrumbList"), None)
    if not posting or not breadcrumb:
        fail("TECH_SEO_BLOGPOSTING_AND_BREADCRUMB_JSONLD_REQUIRED")
    for field in ("headline", "description", "datePublished", "dateModified", "inLanguage", "mainEntityOfPage", "author", "publisher", "keywords"):
        if not posting.get(field):
            fail(f"TECH_SEO_JSONLD_FIELD_REQUIRED:{field}")
    if posting.get("mainEntityOfPage") != canonical_expected:
        fail("TECH_SEO_JSONLD_CANONICAL_MISMATCH")

    sitemap = pathlib.Path("sitemap.xml").read_text(encoding="utf-8")
    rss = pathlib.Path("blog/rss.xml").read_text(encoding="utf-8")
    index = pathlib.Path("blog/index.html").read_text(encoding="utf-8")
    if sitemap.count(canonical_expected) != 1:
        fail(f"TECH_SEO_SITEMAP_EXACTLY_ONCE_REQUIRED:{sitemap.count(canonical_expected)}")
    if rss.count(canonical_expected) < 1:
        fail("TECH_SEO_RSS_ENTRY_REQUIRED")
    if f'/blog/{slug}/' not in index:
        fail("TECH_SEO_BLOG_INDEX_LINK_REQUIRED")

    parsed = urlparse(canonical_expected)
    if parsed.scheme != "https" or parsed.netloc != "www.bedrijfsgeheugen.nl":
        fail("TECH_SEO_CANONICAL_HTTPS_WWW_REQUIRED")

    print(json.dumps({
        "status": "TECHNICAL_SEO_GREEN",
        "article": str(article),
        "canonical": canonical_expected,
        "keyword": keyword,
        "title_length": len(title),
        "meta_length": len(descriptions[0]),
        "words": len(words),
        "internal_links": len(internal),
        "indexable": True,
        "schema": "BlogPosting+BreadcrumbList",
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
