#!/usr/bin/env python3
"""Fail-closed technical SEO checks for Bedrijfsgeheugen.nl.

The sitemap is the canonical list of public indexable URLs. Every URL in it must
resolve to a repository HTML source and satisfy the same minimum contract.
Standard library only so it runs cheaply in GitHub Actions.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://www.bedrijfsgeheugen.nl"
SITEMAP = ROOT / "sitemap.xml"
ROBOTS = ROOT / "robots.txt"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.in_title = False
        self.h1_count = 0
        self.html_lang = ""
        self.meta: dict[str, str] = {}
        self.props: dict[str, str] = {}
        self.canonical: list[str] = []
        self.links: list[str] = []
        self.jsonld: list[str] = []
        self.in_jsonld = False
        self.jsonld_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        a = {k.lower(): (v or "") for k, v in attrs}
        tag = tag.lower()
        if tag == "html":
            self.html_lang = a.get("lang", "")
        elif tag == "title":
            self.in_title = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "meta":
            if a.get("name"):
                self.meta[a["name"].lower()] = a.get("content", "").strip()
            if a.get("property"):
                self.props[a["property"].lower()] = a.get("content", "").strip()
        elif tag == "link" and "canonical" in a.get("rel", "").lower().split():
            self.canonical.append(a.get("href", "").strip())
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"].strip())
        elif tag == "script" and a.get("type", "").lower() == "application/ld+json":
            self.in_jsonld = True
            self.jsonld_parts = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self.in_jsonld:
            self.in_jsonld = False
            self.jsonld.append("".join(self.jsonld_parts).strip())
            self.jsonld_parts = []

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self.in_jsonld:
            self.jsonld_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


def source_for_url(url: str) -> Path | None:
    p = urlparse(url).path
    if p == "/":
        candidates = [ROOT / "index.html"]
    else:
        clean = p.strip("/")
        candidates = [ROOT / f"{clean}.html", ROOT / clean / "index.html"]
        if p.endswith("/"):
            candidates.reverse()
    return next((c for c in candidates if c.is_file()), None)


def normalize_public_url(raw: str, current: str) -> str | None:
    if not raw or raw.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    absolute = urljoin(current, raw)
    parsed = urlparse(absolute)
    if parsed.netloc not in {"www.bedrijfsgeheugen.nl", "bedrijfsgeheugen.nl"}:
        return None
    path = parsed.path or "/"
    if path != "/" and path.endswith(".html"):
        path = path[:-5]
    if path != "/" and path.endswith("/") and not path.startswith("/blog/"):
        path = path.rstrip("/")
    return BASE + path


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def warn(warnings: list[str], message: str) -> None:
    warnings.append(message)


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    if not SITEMAP.is_file():
        fail(errors, "missing sitemap.xml")
        urls: list[str] = []
        nodes = []
    else:
        try:
            tree = ET.parse(SITEMAP)
            nodes = tree.findall("sm:url", NS)
            urls = [(n.findtext("sm:loc", default="", namespaces=NS) or "").strip() for n in nodes]
        except ET.ParseError as exc:
            fail(errors, f"sitemap.xml is invalid XML: {exc}")
            urls, nodes = [], []

    if not urls:
        fail(errors, "sitemap contains no URLs")

    counts = Counter(urls)
    for u, count in counts.items():
        if count > 1:
            fail(errors, f"duplicate sitemap URL ({count}x): {u}")

    for n, u in zip(nodes, urls):
        parsed = urlparse(u)
        if parsed.scheme != "https" or parsed.netloc != "www.bedrijfsgeheugen.nl":
            fail(errors, f"sitemap URL must use canonical HTTPS www host: {u}")
        if parsed.query or parsed.fragment:
            fail(errors, f"sitemap URL may not contain query/fragment: {u}")
        if parsed.path.endswith(".html"):
            fail(errors, f"pretty canonical URL required; .html found: {u}")
        lastmod = (n.findtext("sm:lastmod", default="", namespaces=NS) or "").strip()
        if lastmod:
            try:
                d = date.fromisoformat(lastmod[:10])
                if d > date.today():
                    fail(errors, f"future sitemap lastmod {lastmod}: {u}")
            except ValueError:
                fail(errors, f"invalid sitemap lastmod {lastmod}: {u}")
        else:
            warn(warnings, f"missing lastmod: {u}")

    robots = ROBOTS.read_text(encoding="utf-8") if ROBOTS.is_file() else ""
    if not robots:
        fail(errors, "missing/empty robots.txt")
    if "User-agent: *" not in robots or "Allow: /" not in robots:
        fail(errors, "robots.txt must explicitly allow the public site")
    if f"Sitemap: {BASE}/sitemap.xml" not in robots:
        fail(errors, "robots.txt must declare canonical sitemap URL")

    pages: dict[str, PageParser] = {}
    sources: dict[str, Path] = {}
    titles: defaultdict[str, list[str]] = defaultdict(list)
    descriptions: defaultdict[str, list[str]] = defaultdict(list)
    canonicals: defaultdict[str, list[str]] = defaultdict(list)
    keyword_targets: defaultdict[str, list[str]] = defaultdict(list)

    for u in urls:
        src = source_for_url(u)
        if src is None:
            fail(errors, f"sitemap URL has no repository HTML source: {u}")
            continue
        sources[u] = src
        text = src.read_text(encoding="utf-8", errors="replace")
        parser = PageParser()
        try:
            parser.feed(text)
        except Exception as exc:
            fail(errors, f"HTML parser failed for {src.relative_to(ROOT)}: {exc}")
            continue
        pages[u] = parser

        rel = src.relative_to(ROOT)
        if not parser.html_lang.lower().startswith("nl"):
            fail(errors, f"{rel}: html lang must be nl/nl-NL")
        if not parser.title:
            fail(errors, f"{rel}: missing <title>")
        elif len(parser.title) > 65:
            warn(warnings, f"{rel}: title is {len(parser.title)} chars (>65)")
        else:
            titles[parser.title.casefold()].append(u)

        desc = parser.meta.get("description", "")
        if not desc:
            fail(errors, f"{rel}: missing meta description")
        else:
            if len(desc) < 70 or len(desc) > 170:
                warn(warnings, f"{rel}: description length {len(desc)} (target 70-170)")
            descriptions[desc.casefold()].append(u)

        if len(parser.canonical) != 1:
            fail(errors, f"{rel}: expected exactly one canonical, found {len(parser.canonical)}")
        else:
            canonical = parser.canonical[0].rstrip("/") if u != BASE + "/" else parser.canonical[0]
            expected = u.rstrip("/") if u != BASE + "/" else u
            if canonical != expected:
                fail(errors, f"{rel}: canonical {parser.canonical[0]} != sitemap URL {u}")
            canonicals[parser.canonical[0]].append(u)

        robots_meta = parser.meta.get("robots", "").lower()
        if "noindex" in robots_meta or "nofollow" in robots_meta:
            fail(errors, f"{rel}: sitemap page cannot be noindex/nofollow")
        if parser.h1_count != 1:
            fail(errors, f"{rel}: expected exactly one H1, found {parser.h1_count}")

        for key in ("og:title", "og:description", "og:url", "og:image"):
            if not parser.props.get(key):
                fail(errors, f"{rel}: missing {key}")
        og_url = parser.props.get("og:url", "")
        if og_url and og_url.rstrip("/") != u.rstrip("/"):
            fail(errors, f"{rel}: og:url {og_url} != sitemap URL {u}")
        if parser.meta.get("twitter:card", "") != "summary_large_image":
            warn(warnings, f"{rel}: twitter:card should be summary_large_image")

        if not parser.jsonld:
            fail(errors, f"{rel}: missing JSON-LD structured data")
        for i, block in enumerate(parser.jsonld, 1):
            try:
                json.loads(block)
            except json.JSONDecodeError as exc:
                fail(errors, f"{rel}: invalid JSON-LD block {i}: {exc}")

        keyword = parser.meta.get("bg-zoekwoord", "").strip().casefold()
        if keyword:
            keyword_targets[keyword].append(u)
        else:
            warn(warnings, f"{rel}: missing internal bg-zoekwoord target")

    for value, owners in titles.items():
        if len(owners) > 1:
            fail(errors, f"duplicate title across sitemap pages: {owners}")
    for value, owners in descriptions.items():
        if len(owners) > 1:
            warn(warnings, f"duplicate meta description: {owners}")
    for value, owners in canonicals.items():
        if len(owners) > 1:
            fail(errors, f"duplicate canonical target: {owners}")
    for value, owners in keyword_targets.items():
        if len(owners) > 1:
            warn(warnings, f"keyword cannibalisation candidate '{value}': {owners}")

    # Orphan prevention: every sitemap URL except the homepage must receive at
    # least one internal link from another indexable sitemap page.
    incoming = Counter()
    sitemap_set = set(urls)
    for current, parser in pages.items():
        for href in parser.links:
            target = normalize_public_url(href, current)
            if target in sitemap_set and target != current:
                incoming[target] += 1
    for u in urls:
        if u != BASE + "/" and u in pages and incoming[u] == 0:
            fail(errors, f"orphan sitemap page: {u}")

    print(f"SEO Guardian: {len(pages)}/{len(urls)} sitemap pages parsed")
    print(f"Errors: {len(errors)} | Warnings: {len(warnings)}")
    for item in warnings:
        print(f"::warning::{item}")
    for item in errors:
        print(f"::error::{item}")
    if errors:
        print("FAIL: technical SEO contract is not green.")
        return 1
    print("PASS: technical SEO contract is green.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
