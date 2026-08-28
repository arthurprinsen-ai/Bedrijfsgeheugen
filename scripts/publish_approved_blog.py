#!/usr/bin/env python3
import datetime as dt
import html
import json
import os
import pathlib
import re
import sys
import urllib.request

API = "https://api.notion.com/v1"
NOTION_VERSION = "2025-09-03"
QUEUE_DS = os.getenv("NOTION_BLOG_DB", "70706495-cc0c-44ed-84bc-493df00651f1")
TEMPLATE = pathlib.Path("blog/bedrijfsopvolging-begin-bij-het-geheugen/index.html")
BLOG_INDEX = pathlib.Path("blog/index.html")
RSS = pathlib.Path("blog/rss.xml")
SITEMAP = pathlib.Path("sitemap.xml")


def fail(msg):
    print(f"::error::{msg}", file=sys.stderr)
    raise SystemExit(1)


def notion_request(path, method="GET", body=None):
    token = os.environ.get("NOTION_TOKEN", "").strip()
    if not token:
        fail("NOTION_TOKEN ontbreekt")
    req = urllib.request.Request(
        API + path,
        data=None if body is None else json.dumps(body).encode(),
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def text_prop(props, name):
    p = props.get(name) or {}
    arr = p.get("rich_text") or p.get("title") or []
    return "".join(x.get("plain_text", "") for x in arr).strip()


def select_prop(props, name):
    return (((props.get(name) or {}).get("select") or {}).get("name") or "").strip()


def checkbox_prop(props, name):
    return bool((props.get(name) or {}).get("checkbox"))


def url_prop(props, name):
    return str((props.get(name) or {}).get("url") or "").strip()


def number_prop(props, name):
    return (props.get(name) or {}).get("number") or 0


def page_id_from_url(url):
    m = re.search(r"([0-9a-fA-F]{32})(?:\?|$)", url.replace("-", ""))
    if not m:
        fail("Bronpagina bevat geen geldige Notion page-id")
    s = m.group(1).lower()
    return f"{s[:8]}-{s[8:12]}-{s[12:16]}-{s[16:20]}-{s[20:]}"


def query_queue(force_slug=""):
    conditions = [
        {"property": "Status", "select": {"equals": "Gepland"}},
        {"property": "Source Mode", "select": {"equals": "Approved central article"}},
        {"property": "Dispatch status", "select": {"equals": "Pending"}},
        {"property": "Autopublish toegestaan", "checkbox": {"equals": True}},
        {"property": "Quality gate", "select": {"equals": "Geslaagd"}},
        {"property": "Herzien", "select": {"equals": "Goedgekeurd"}},
    ]
    if force_slug:
        conditions.append({"property": "Slug", "rich_text": {"equals": force_slug}})
    body = {
        "filter": {"and": conditions},
        "sorts": [{"property": "Publicatiedatum", "direction": "ascending"}],
        "page_size": 2,
    }
    rows = notion_request(f"/data_sources/{QUEUE_DS}/query", "POST", body).get("results") or []
    if not rows:
        return None
    if force_slug and len(rows) != 1:
        fail(f"Geforceerde slug is niet uniek; gevonden={len(rows)}")
    return rows[0]


def validate_queue(row):
    p = row.get("properties") or {}
    q = {
        "page_id": row["id"],
        "slug": text_prop(p, "Slug"),
        "source_id": text_prop(p, "Bron Content ID"),
        "command_id": text_prop(p, "Publish Command ID"),
        "source_page": url_prop(p, "Bronpagina"),
        "attempt": int(number_prop(p, "Dispatch attempt")),
    }
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", q["slug"]):
        fail("Queue bevat ongeldige slug")
    expected = f"seo-publish|{q['source_id']}|{q['slug']}"
    if q["command_id"].replace("\\|", "|") != expected:
        fail("Publish Command ID komt niet exact overeen met Content ID + slug")
    if not q["source_page"]:
        fail("Bronpagina ontbreekt")
    if q["attempt"] >= 2:
        fail("Maximaal twee dispatchpogingen toegestaan")
    return q


def validate_source(page, q):
    p = page.get("properties") or {}
    source = {
        "content_id": text_prop(p, "Content ID"),
        "title": text_prop(p, "Titel"),
        "blogtext": text_prop(p, "Blogtekst"),
        "slug": text_prop(p, "SEO Slug"),
        "keyword": text_prop(p, "SEO focuszoekwoord"),
        "meta": text_prop(p, "SEO metaomschrijving"),
        "contenttype": select_prop(p, "Contenttype"),
        "approved": select_prop(p, "Herzien"),
        "publicationcheck": select_prop(p, "Publicatiecheck"),
        "make_status": select_prop(p, "Make status"),
        "red_thread": select_prop(p, "Rode-draadcheck"),
        "generate": checkbox_prop(p, "Genereren"),
        "testmode": checkbox_prop(p, "Testmodus"),
        "public_url": url_prop(p, "Publicatielink"),
    }
    checks = {
        "content_id_match": source["content_id"] == q["source_id"],
        "contenttype": source["contenttype"] == "Artikel",
        "approved": source["approved"] == "Goedgekeurd",
        "publicationcheck": source["publicationcheck"] == "Gereed",
        "make_status": source["make_status"] == "Publiceren",
        "red_thread": source["red_thread"] == "Klopt",
        "generate_off": not source["generate"],
        "testmode_off": not source["testmode"],
        "not_published": not source["public_url"],
        "slug_match": source["slug"] == q["slug"],
        "title": bool(source["title"]),
        "blogtext": bool(source["blogtext"]),
        "keyword": bool(source["keyword"]),
        "meta": 120 <= len(source["meta"]) <= 170,
    }
    bad = [k for k, ok in checks.items() if not ok]
    if bad:
        fail("Centrale bron faalt toelatingspoort: " + ", ".join(bad))
    return source


def inline_format(value):
    value = html.escape(value, quote=False)
    value = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2">\1</a>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)
    return value


def render_approved_text(raw):
    raw = raw.replace("\r\n", "\n").replace("<br><br>", "\n\n").replace("<br>", "\n")
    blocks = [b.strip() for b in re.split(r"\n\s*\n", raw) if b.strip()]
    out = []
    first_paragraph = True
    for block in blocks:
        if block.startswith("## "):
            out.append(f"    <h2>{inline_format(block[3:].strip())}</h2>")
            continue
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if lines and all(re.match(r"^-\s+", ln) for ln in lines):
            items = "".join(f"<li>{inline_format(re.sub(r'^-\\s+', '', ln))}</li>" for ln in lines)
            out.append(f"    <ul>{items}</ul>")
            continue
        if lines and all(re.match(r"^\d+\.\s+", ln) for ln in lines):
            items = "".join(f"<li>{inline_format(re.sub(r'^\\d+\\.\\s+', '', ln))}</li>" for ln in lines)
            out.append(f"    <ol>{items}</ol>")
            continue
        body = "<br>".join(inline_format(ln) for ln in lines)
        cls = ' class="lead"' if first_paragraph else ""
        out.append(f"    <p{cls}>{body}</p>")
        first_paragraph = False
    return "\n\n".join(out)


def replace_once(pattern, repl, text, flags=0):
    new, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        fail("Templatecontract faalde: " + pattern[:60])
    return new


def build_article(template, source):
    slug = source["slug"]
    title = source["title"]
    meta = source["meta"]
    keyword = source["keyword"]
    canonical = f"https://www.bedrijfsgeheugen.nl/blog/{slug}/"
    today = dt.date.today().isoformat()
    body = render_approved_text(source["blogtext"])
    main = (
        '<main>\n<div class="wrap">\n'
        '  <nav class="bgkruim" aria-label="Kruimelpad"><a href="/">Home</a><span aria-hidden="true">&rsaquo;</span><a href="/blog/">Blog</a><span aria-hidden="true">&rsaquo;</span>'
        f'<span aria-current="page">{html.escape(title)}</span></nav>\n'
        '  <div class="voortgang" id="vg"></div>\n<article class="artikel">\n'
        '  <div class="artikelkop">\n'
        '    <span class="eyebrow">Kennisborging · Bedrijfscontinuïteit</span>\n'
        f'    <h1>{html.escape(title)}</h1>\n'
        f'    <div class="artikelmeta"><span>{dt.date.today().strftime("%d-%m-%Y")}</span> · <span>Arthur Prinsen</span></div>\n'
        '  </div>\n\n' + body + '\n  </article>\n</div>\n</main>'
    )
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting", "headline": title, "description": meta,
                "datePublished": today, "dateModified": today, "inLanguage": "nl-NL",
                "mainEntityOfPage": canonical,
                "author": {"@type": "Person", "name": "Arthur Prinsen", "url": "https://www.bedrijfsgeheugen.nl/over-ons"},
                "publisher": {"@id": "https://www.bedrijfsgeheugen.nl/#org"},
                "articleSection": "Kennisborging", "keywords": keyword,
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.bedrijfsgeheugen.nl/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.bedrijfsgeheugen.nl/blog/"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": canonical},
                ],
            },
        ],
    }
    text = template
    text = replace_once(r"<title>.*?</title>", f"<title>{html.escape(title)}</title>", text, re.S)
    text = replace_once(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape(meta, quote=True)}">', text)
    text = replace_once(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{canonical}">', text)
    text = replace_once(r'<meta name="bg-zoekwoord" content="[^"]*">', f'<meta name="bg-zoekwoord" content="{html.escape(keyword, quote=True)}">', text)
    text = replace_once(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{html.escape(title, quote=True)}">', text)
    text = replace_once(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{html.escape(meta, quote=True)}">', text)
    text = replace_once(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{canonical}">', text)
    text = replace_once(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(",", ":")) + '</script>', text, re.S)
    text = replace_once(r"<main>.*?</main>", main, text, re.S)
    return text


def update_blog_index(source):
    text = BLOG_INDEX.read_text(encoding="utf-8")
    href = f"/blog/{source['slug']}/"
    if href in text:
        return
    plain = re.sub(r"<[^>]+>", " ", render_approved_text(source["blogtext"]))
    plain = re.sub(r"\s+", " ", html.unescape(plain)).strip()
    teaser = plain[:180].rsplit(" ", 1)[0] + "…"
    card = (
        f'  <a class="kaart" href="{href}">\n'
        '    <span class="tag">Kennisborging</span>\n'
        f'    <h2>{html.escape(source["title"])}</h2>\n'
        f'    <p>{html.escape(teaser)}</p>\n'
        '    <span class="lees">Lees het artikel &rarr;</span>\n'
        f'    <span class="datum">{dt.date.today().strftime("%d-%m-%Y")} &middot; nieuw</span>\n'
        '  </a>\n\n'
    )
    marker = '<div class="artikelen">\n'
    if marker not in text:
        fail("Blogindex mist artikelen-marker")
    BLOG_INDEX.write_text(text.replace(marker, marker + "\n" + card, 1), encoding="utf-8")


def update_sitemap(source):
    text = SITEMAP.read_text(encoding="utf-8")
    url = f"https://www.bedrijfsgeheugen.nl/blog/{source['slug']}/"
    if url in text:
        return
    entry = f"  <url><loc>{url}</loc><lastmod>{dt.date.today().isoformat()}</lastmod></url>\n"
    if "</urlset>" not in text:
        fail("sitemap.xml mist </urlset>")
    SITEMAP.write_text(text.replace("</urlset>", entry + "</urlset>", 1), encoding="utf-8")


def update_rss(source):
    text = RSS.read_text(encoding="utf-8")
    url = f"https://www.bedrijfsgeheugen.nl/blog/{source['slug']}/"
    if url in text:
        return
    pub = dt.datetime.now(dt.timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    item = (
        "    <item>\n"
        f"      <title>{html.escape(source['title'])}</title>\n"
        f"      <link>{url}</link>\n"
        f"      <guid>{url}</guid>\n"
        f"      <pubDate>{pub}</pubDate>\n"
        f"      <description>{html.escape(source['meta'])}</description>\n"
        "    </item>\n"
    )
    if "<channel>" not in text:
        fail("rss.xml mist <channel>")
    RSS.write_text(text.replace("<channel>", "<channel>\n" + item, 1), encoding="utf-8")


def patch_queue(page_id, attempt, status, fingerprint=""):
    props = {
        "Dispatch status": {"select": {"name": status}},
        "Dispatch attempt": {"number": attempt},
    }
    if status == "Dispatched":
        props["Dispatched At"] = {"date": {"start": dt.datetime.now(dt.timezone.utc).isoformat()}}
    if fingerprint:
        props["Failure fingerprint"] = {"rich_text": [{"type": "text", "text": {"content": fingerprint[:1900]}}]}
    notion_request(f"/pages/{page_id}", "PATCH", {"properties": props})


def main():
    force_slug = sys.argv[1].strip() if len(sys.argv) > 1 else ""
    if force_slug and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", force_slug):
        fail("Ongeldige geforceerde slug")
    row = query_queue(force_slug)
    if row is None:
        print("NO_ACTION: geen Pending Approved central article")
        return
    q = validate_queue(row)
    target = pathlib.Path("blog") / q["slug"] / "index.html"
    if target.exists():
        fail("Doelslug bestaat al; verificatie vereist in plaats van tweede commit")
    source = validate_source(notion_request(f"/pages/{page_id_from_url(q['source_page'])}"), q)
    if not TEMPLATE.exists():
        fail(f"Template ontbreekt: {TEMPLATE}")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(build_article(TEMPLATE.read_text(encoding="utf-8"), source), encoding="utf-8")
    update_blog_index(source)
    update_rss(source)
    update_sitemap(source)
    patch_queue(q["page_id"], q["attempt"] + 1, "Dispatched")
    print(json.dumps({"status": "RENDERED", "slug": q["slug"], "content_id": source["content_id"], "command_id": q["command_id"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
