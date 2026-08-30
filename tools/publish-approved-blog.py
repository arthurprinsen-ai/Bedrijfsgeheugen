#!/usr/bin/env python3
"""Deterministically publish one already-approved central Notion article.

This executable is deliberately non-generative. It resolves one exact queue command,
re-reads the linked central article, validates all approval invariants and only then
renders the approved Blogtekst into the existing static-site article template.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import html
import json
import os
from pathlib import Path
import re
import sys
import urllib.request

BASE_URL = "https://www.bedrijfsgeheugen.nl"
NOTION_VERSION = "2022-06-28"
TEMPLATE = Path("blog/kennis-borgen-in-je-bedrijf/index.html")
QUEUE_DB = os.environ.get("NOTION_BLOG_DB", "").strip()
TOKEN = os.environ.get("NOTION_TOKEN", "").strip()
CONTENT_ID = os.environ.get("CONTENT_ID", "").strip()
SLUG = os.environ.get("SLUG", "").strip()
PUBLISH_COMMAND_ID = os.environ.get("PUBLISH_COMMAND_ID", "").strip()
GITHUB_OUTPUT = os.environ.get("GITHUB_OUTPUT", "").strip()


def fail(message: str) -> None:
    print(f"::error::{message}")
    raise SystemExit(1)


def notion(path: str, *, method: str = "GET", payload: dict | None = None) -> dict:
    if not TOKEN or not QUEUE_DB:
        fail("NOTION_TOKEN and NOTION_BLOG_DB are required; approved publishing has no local fallback")
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        f"https://api.notion.com{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def rich(props: dict, name: str) -> str:
    value = props.get(name) or {}
    parts = value.get("rich_text") or value.get("title") or []
    return "".join(str(part.get("plain_text") or "") for part in parts).strip()


def select(props: dict, name: str) -> str:
    return str(((props.get(name) or {}).get("select") or {}).get("name") or "")


def checkbox(props: dict, name: str) -> bool:
    return bool((props.get(name) or {}).get("checkbox"))


def page_id_from_url(url: str) -> str:
    match = re.search(r"([0-9a-f]{32})(?:\?|$)", url.replace("-", ""), re.I)
    if not match:
        fail("Bronpagina does not contain a valid Notion page id")
    raw = match.group(1).lower()
    return f"{raw[:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:]}"


def normalize_source(text: str) -> str:
    text = text.replace("<br><br>", "\n\n").replace("<br />", "\n").replace("<br>", "\n")
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def absolute_url(url: str) -> str:
    url = url.strip()
    if url.startswith("https://") or url.startswith("http://") or url.startswith("mailto:") or url.startswith("tel:"):
        return url
    if not url.startswith("/"):
        url = "/" + url
    return BASE_URL + url


LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def inline(text: str) -> str:
    out: list[str] = []
    cursor = 0
    for match in LINK_RE.finditer(text):
        out.append(html.escape(text[cursor:match.start()]))
        label = html.escape(match.group(1))
        href = html.escape(absolute_url(match.group(2)), quote=True)
        out.append(f'<a href="{href}">{label}</a>')
        cursor = match.end()
    out.append(html.escape(text[cursor:]))
    return "".join(out)


def render_approved_markdown(raw: str) -> str:
    lines = normalize_source(raw).split("\n")
    rendered: list[str] = []
    paragraph: list[str] = []
    list_type: str | None = None

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            rendered.append(f"<p>{inline(' '.join(x.strip() for x in paragraph))}</p>")
            paragraph = []

    def close_list() -> None:
        nonlocal list_type
        if list_type:
            rendered.append(f"</{list_type}>")
            list_type = None

    for raw_line in lines + [""]:
        line = raw_line.strip()
        if line.startswith("## "):
            flush_paragraph(); close_list()
            rendered.append(f"<h2>{inline(line[3:])}</h2>")
            continue
        ordered = re.match(r"^\d+\.\s+(.+)$", line)
        unordered = re.match(r"^-\s+(.+)$", line)
        if ordered or unordered:
            flush_paragraph()
            wanted = "ol" if ordered else "ul"
            if list_type != wanted:
                close_list(); list_type = wanted; rendered.append(f"<{wanted}>")
            rendered.append(f"<li>{inline((ordered or unordered).group(1))}</li>")
            continue
        if not line:
            flush_paragraph(); close_list()
            continue
        if list_type:
            close_list()
        paragraph.append(line)

    return "\n".join(rendered)


def replace_once(text: str, pattern: str, replacement: str, label: str, *, flags: int = 0) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        fail(f"template invariant failed: {label}")
    return updated


def make_article(template: str, *, title: str, meta: str, keyword: str, approved_html: str, source_hash: str) -> str:
    canonical = f"{BASE_URL}/blog/{SLUG}/"
    today = dt.date.today().isoformat()
    title_e = html.escape(title)
    meta_e = html.escape(meta, quote=True)
    keyword_e = html.escape(keyword, quote=True)
    canonical_e = html.escape(canonical, quote=True)

    doc = replace_once(template, r"<title>.*?</title>", f"<title>{title_e}</title>", "title")
    doc = replace_once(doc, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{meta_e}">', "description")
    doc = replace_once(doc, r'<link rel="canonical" href="[^"]+">', f'<link rel="canonical" href="{canonical_e}">', "canonical")
    doc = replace_once(doc, r'<meta name="bg-zoekwoord" content="[^"]*">', f'<meta name="bg-zoekwoord" content="{keyword_e}">\n<meta name="bg-approved-source-hash" content="{source_hash}">', "keyword")
    doc = replace_once(doc, r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{title_e}">', "og title")
    doc = replace_once(doc, r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{meta_e}">', "og description")
    doc = replace_once(doc, r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{canonical_e}">', "og url")

    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": title,
                "description": meta,
                "datePublished": today,
                "dateModified": today,
                "inLanguage": "nl-NL",
                "mainEntityOfPage": canonical,
                "author": {"@type": "Person", "name": "Arthur Prinsen", "url": f"{BASE_URL}/over-ons"},
                "publisher": {"@id": f"{BASE_URL}/#org"},
                "keywords": keyword,
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE_URL}/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{BASE_URL}/blog/"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": canonical},
                ],
            },
        ],
    }
    json_ld = '<script type="application/ld+json">' + json.dumps(graph, ensure_ascii=False, separators=(",", ":")) + "</script>"
    doc = replace_once(doc, r'<script type="application/ld\+json">.*?</script>', json_ld, "json-ld", flags=re.S)

    main = f'''<main id="main-content">
<div class="wrap">
  <div class="kruimel"><a href="{BASE_URL}/">Home</a> / <a href="{BASE_URL}/blog/">Blog</a> / {title_e}</div>
  <header class="artikelkop">
    <span class="eyebrow">Praktijkcase · {today}</span>
    <h1>{title_e}</h1>
    <div class="artikelmeta"><span>Bedrijfsgeheugen</span><span>·</span><span>Goedgekeurde bron</span></div>
  </header>
  <article class="artikel" data-content-id="{html.escape(CONTENT_ID, quote=True)}" data-approved-source-hash="{source_hash}">
{approved_html}
  </article>
</div>
</main>'''
    doc = replace_once(doc, r"<main\b.*?</main>", main, "main article", flags=re.S)

    # New HTML produced by this renderer uses complete href URLs, including navigation inherited from the template.
    doc = re.sub(r'href="/(?!/)([^"]*)"', lambda m: f'href="{BASE_URL}/{m.group(1)}"', doc)
    return doc


def update_blog_index(title: str, meta: str) -> None:
    path = Path("blog/index.html")
    text = path.read_text(encoding="utf-8")
    canonical = f"{BASE_URL}/blog/{SLUG}/"
    if canonical in text:
        return
    card = (
        f'\n<a class="kaart" href="{canonical}"><span class="tag">Praktijkcase</span>'
        f'<h2>{html.escape(title)}</h2><p>{html.escape(meta)}</p>'
        f'<span class="datum">{dt.date.today().isoformat()}</span><span class="lees">Lees artikel →</span></a>\n'
    )
    marker = '<div class="artikelen">'
    if marker not in text:
        fail("blog index marker missing")
    path.write_text(text.replace(marker, marker + card, 1), encoding="utf-8")


def update_rss(title: str, meta: str) -> None:
    path = Path("blog/rss.xml")
    text = path.read_text(encoding="utf-8")
    canonical = f"{BASE_URL}/blog/{SLUG}/"
    if canonical in text:
        return
    now = dt.datetime.now(dt.timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    item = (
        f"\n<item><title>{html.escape(title)}</title><link>{canonical}</link><guid>{canonical}</guid>"
        f"<pubDate>{now}</pubDate><description>{html.escape(meta)}</description></item>\n"
    )
    if "<channel>" not in text:
        fail("RSS channel marker missing")
    path.write_text(text.replace("<channel>", "<channel>" + item, 1), encoding="utf-8")


def update_sitemap() -> None:
    path = Path("sitemap.xml")
    text = path.read_text(encoding="utf-8")
    canonical = f"{BASE_URL}/blog/{SLUG}/"
    if canonical in text:
        return
    row = f'  <url><loc>{canonical}</loc><lastmod>{dt.date.today().isoformat()}</lastmod></url>\n'
    if "</urlset>" not in text:
        fail("sitemap urlset marker missing")
    path.write_text(text.replace("</urlset>", row + "</urlset>", 1), encoding="utf-8")


def emit(**values: str) -> None:
    for key, value in values.items():
        print(f"{key}={value}")
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, "a", encoding="utf-8") as fh:
            for key, value in values.items():
                fh.write(f"{key}={value}\n")


def main() -> None:
    if not re.fullmatch(r"BG-\d+", CONTENT_ID):
        fail("content_id must be an exact BG-nnn identifier")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", SLUG):
        fail("slug is invalid or not normalized")
    expected_command = f"seo-publish|{CONTENT_ID}|{SLUG}"
    if PUBLISH_COMMAND_ID != expected_command:
        fail("Publish Command ID does not equal deterministic content_id+slug key")

    payload = {
        "filter": {"and": [
            {"property": "Bron Content ID", "rich_text": {"equals": CONTENT_ID}},
            {"property": "Publish Command ID", "rich_text": {"equals": PUBLISH_COMMAND_ID}},
            {"property": "Slug", "rich_text": {"equals": SLUG}},
            {"property": "Status", "select": {"equals": "Gepland"}},
            {"property": "Autopublish toegestaan", "checkbox": {"equals": True}},
            {"property": "Quality gate", "select": {"equals": "Geslaagd"}},
            {"property": "Herzien", "select": {"equals": "Goedgekeurd"}},
            {"property": "Source Mode", "select": {"equals": "Approved central article"}},
        ]},
        "page_size": 2,
    }
    result = notion(f"/v1/databases/{QUEUE_DB}/query", method="POST", payload=payload)
    rows = result.get("results") or []
    if len(rows) != 1:
        fail(f"exact queue command required; found {len(rows)} records")

    queue_props = rows[0].get("properties") or {}
    source_mode = select(queue_props, "Source Mode")
    if source_mode != "Approved central article":
        fail("Source Mode must be Approved central article")
    if not checkbox(queue_props, "Autopublish toegestaan") or select(queue_props, "Quality gate") != "Geslaagd":
        fail("queue approval gates changed after dispatch")
    bronpagina = str(((queue_props.get("Bronpagina") or {}).get("url")) or "")
    source_id = page_id_from_url(bronpagina)
    source = notion(f"/v1/pages/{source_id}")
    props = source.get("properties") or {}

    invariants = {
        "Content ID": rich(props, "Content ID") == CONTENT_ID,
        "Herzien": select(props, "Herzien") == "Goedgekeurd",
        "Publicatiecheck": select(props, "Publicatiecheck") == "Gereed",
        "Make status": select(props, "Make status") == "Publiceren",
        "Genereren": not checkbox(props, "Genereren"),
        "Testmodus": not checkbox(props, "Testmodus"),
        "Rode-draadcheck": select(props, "Rode-draadcheck") == "Klopt",
        "SEO Slug": rich(props, "SEO Slug") == SLUG,
        "Publish Command ID": rich(props, "Publish Command ID") == PUBLISH_COMMAND_ID,
    }
    failed = [name for name, ok in invariants.items() if not ok]
    if failed:
        fail("central approval invariants failed: " + ", ".join(failed))

    title = rich(props, "Titel")
    approved = rich(props, "Blogtekst")
    meta = rich(props, "SEO metaomschrijving")
    keyword = rich(props, "SEO focuszoekwoord")
    if not all([title, approved, meta, keyword]):
        fail("approved central content is incomplete")

    approved_normalized = normalize_source(approved)
    approved_source_hash = hashlib.sha256(approved_normalized.encode("utf-8")).hexdigest()
    target = Path("blog") / SLUG / "index.html"
    if target.exists():
        emit(status="ALREADY_EXISTS_VERIFY_ONLY", approved_source_hash=approved_source_hash, source_page_id=source_id)
        return

    if not TEMPLATE.exists():
        fail("approved article template is missing")
    approved_html = render_approved_markdown(approved_normalized)
    document = make_article(
        TEMPLATE.read_text(encoding="utf-8"),
        title=title,
        meta=meta,
        keyword=keyword,
        approved_html=approved_html,
        source_hash=approved_source_hash,
    )
    target.parent.mkdir(parents=True, exist_ok=False)
    target.write_text(document, encoding="utf-8")
    update_blog_index(title, meta)
    update_rss(title, meta)
    update_sitemap()
    emit(status="RENDERED", approved_source_hash=approved_source_hash, source_page_id=source_id)


if __name__ == "__main__":
    main()
