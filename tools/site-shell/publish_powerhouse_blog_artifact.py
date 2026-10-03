#!/usr/bin/env python3
# Delivery metadata is carried by the protected PR.
import datetime as dt
import html
import json
import pathlib
import re
import sys
import urllib.request
from email.utils import format_datetime

ROOT = pathlib.Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "blog" / "kennis-borgen-in-je-bedrijf" / "index.html"
BLOG_INDEX = ROOT / "blog" / "index.html"
RSS = ROOT / "blog" / "rss.xml"
SITEMAP = ROOT / "sitemap.xml"
EXPORT = "https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-blog-export"

def fail(message):
    raise SystemExit(message)

def fetch(date):
    with urllib.request.urlopen(f"{EXPORT}?date={date}", timeout=30) as response:
        data = json.loads(response.read().decode("utf-8"))
    if not data.get("ok"):
        fail("BLOG_EXPORT_NOT_OK")
    return data

def replace_one(text, pattern, replacement, label, flags=re.S):
    updated, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        fail(f"{label}: expected one replacement, got {count}")
    return updated

def inline_markdown(value):
    escaped = html.escape(value)
    escaped = re.sub(
        r'\[([^\]]+)\]\((https?://[^)]+)\)',
        lambda m: f'<a href="{html.escape(m.group(2), quote=True)}">{m.group(1)}</a>',
        escaped,
    )
    escaped = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', escaped)
    return escaped

def body_html(data):
    blocks = [x.strip() for x in re.split(r"\n\s*\n", data["body"]) if x.strip()]
    if not blocks:
        fail("EMPTY_BLOG_BODY")
    result = []
    lead_written = False
    for block in blocks:
        if block == "---":
            continue
        if block.startswith("# "):
            continue
        if block.startswith("## "):
            result.append(f"<h2>{inline_markdown(block[3:].strip())}</h2>")
            continue
        if block.startswith("### "):
            result.append(f"<h3>{inline_markdown(block[4:].strip())}</h3>")
            continue
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if lines and all(line.startswith("- ") for line in lines):
            result.append("<ul>" + "".join(f"<li>{inline_markdown(line[2:].strip())}</li>" for line in lines) + "</ul>")
            continue
        if len(lines) > 1 and lines[0].startswith("**") and all(line.startswith("- ") for line in lines[1:]):
            result.append(f"<p>{inline_markdown(lines[0])}</p>")
            result.append("<ul>" + "".join(f"<li>{inline_markdown(line[2:].strip())}</li>" for line in lines[1:]) + "</ul>")
            continue
        css = ' class="lead"' if not lead_written else ""
        result.append(f"<p{css}>{inline_markdown(block)}</p>")
        lead_written = True
    if data.get("cta"):
        result.append(
            '<p class="artikel-cta">'
            + inline_markdown(data["cta"])
            + ' <a href="/frisse-blik">Bekijk de Frisse blik &rarr;</a></p>'
        )
    return "\n".join(result)

def main():
    business_date = sys.argv[1] if len(sys.argv) > 1 else dt.date.today().isoformat()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", business_date):
        fail("INVALID_BUSINESS_DATE")
    data = fetch(business_date)
    slug = data["slug"]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        fail("INVALID_SLUG")

    target = ROOT / "blog" / slug / "index.html"
    if target.exists():
        print(f"NO_ACTION:{slug}")
        return

    title_plain = data["title"]
    meta_plain = data["meta_description"]
    focus_plain = data.get("focus_keyword") or title_plain
    title = html.escape(title_plain)
    meta = html.escape(meta_plain, quote=True)
    focus = html.escape(focus_plain, quote=True)
    canonical = data["canonical_url"]
    template = TEMPLATE.read_text(encoding="utf-8")
    template = replace_one(template, r"<title>.*?</title>", f"<title>{title}</title>", "title")
    template = replace_one(
        template,
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{meta}">',
        "meta",
        flags=0,
    )
    template = replace_one(
        template,
        r'<link rel="canonical" href="[^"]+">',
        f'<link rel="canonical" href="{canonical}">',
        "canonical",
        flags=0,
    )
    template = replace_one(
        template,
        r'<meta name="bg-zoekwoord" content="[^"]*">',
        f'<meta name="bg-zoekwoord" content="{focus}">',
        "focus-keyword",
        flags=0,
    )
    template = replace_one(
        template,
        r'<meta property="og:title" content="[^"]*">',
        f'<meta property="og:title" content="{title}">',
        "og-title",
        flags=0,
    )
    template = replace_one(
        template,
        r'<meta property="og:description" content="[^"]*">',
        f'<meta property="og:description" content="{meta}">',
        "og-description",
        flags=0,
    )
    template = replace_one(
        template,
        r'<meta property="og:url" content="[^"]+">',
        f'<meta property="og:url" content="{canonical}">',
        "og-url",
        flags=0,
    )
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": title_plain,
                "description": meta_plain,
                "datePublished": business_date,
                "dateModified": business_date,
                "inLanguage": "nl-NL",
                "mainEntityOfPage": canonical,
                "author": {"@type": "Person", "name": "Arthur Prinsen", "url": "https://www.bedrijfsgeheugen.nl/over-ons"},
                "publisher": {"@id": "https://www.bedrijfsgeheugen.nl/#org"},
                "articleSection": "Powerhouse",
                "keywords": focus_plain,
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.bedrijfsgeheugen.nl/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.bedrijfsgeheugen.nl/blog/"},
                    {"@type": "ListItem", "position": 3, "name": title_plain, "item": canonical},
                ],
            },
        ],
    }
    schema_json = json.dumps(schema, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    template = replace_one(
        template,
        r'<script type="application/ld\+json">.*?</script>',
        f'<script type="application/ld+json">{schema_json}</script>',
        "json-ld",
    )
    template = replace_one(
        template,
        r'(<span aria-current="page">).*?(</span>)',
        rf'\1{title}\2',
        "breadcrumb",
    )
    article = (
        f'<article class="artikel" data-content-id="{html.escape(data["content_id"], quote=True)}">'
        f'<div class="artikelkop"><span class="eyebrow">Powerhouse · Dagelijkse learning</span>'
        f'<h1>{title}</h1><div class="artikelmeta"><span>{business_date[8:10]}-{business_date[5:7]}-{business_date[:4]}</span>'
        f' · <span>Arthur Prinsen</span></div></div>'
        + body_html(data)
        + "</article>"
    )
    template = replace_one(template, r'<article class="artikel">.*?</article>', article, "article")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(template, encoding="utf-8")

    index_text = BLOG_INDEX.read_text(encoding="utf-8")
    href = f"/blog/{slug}/"
    if href not in index_text:
        excerpt_raw = re.sub(r"\s+", " ", data["body"]).strip()
        excerpt = html.escape(excerpt_raw[:220] + ("…" if len(excerpt_raw) > 220 else ""))
        card = (
            f'  <a class="kaart" href="{href}"><span class="tag">Powerhouse</span><h2>{title}</h2>'
            f'<p>{excerpt}</p><span class="lees">Lees het artikel &rarr;</span>'
            f'<span class="datum">{business_date[8:10]}-{business_date[5:7]}-{business_date[:4]} &middot; nieuw</span></a>\n\n'
        )
        index_text = index_text.replace('<div class="artikelen">\n', '<div class="artikelen">\n\n' + card, 1)
        BLOG_INDEX.write_text(index_text, encoding="utf-8")

    rss = RSS.read_text(encoding="utf-8")
    if canonical not in rss:
        pub_date = format_datetime(dt.datetime.now(dt.timezone.utc))
        item = (
            f'<item><title>{title}</title><link>{canonical}</link><guid>{canonical}</guid>'
            f'<pubDate>{pub_date}</pubDate><description>{meta}</description></item>\n\n'
        )
        rss = rss.replace("<channel>\n", "<channel>\n" + item, 1)
        RSS.write_text(rss, encoding="utf-8")

    if SITEMAP.exists():
        sitemap = SITEMAP.read_text(encoding="utf-8")
        if canonical not in sitemap:
            entry = f'  <url><loc>{canonical}</loc><lastmod>{business_date}</lastmod></url>\n'
            sitemap = sitemap.replace("</urlset>", entry + "</urlset>")
            SITEMAP.write_text(sitemap, encoding="utf-8")

    print(json.dumps({
        "ok": True,
        "slug": slug,
        "content_id": data["content_id"],
        "canonical_url": canonical,
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
