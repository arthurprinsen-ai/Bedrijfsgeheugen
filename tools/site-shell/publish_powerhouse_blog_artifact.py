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

def source_plain(value):
    value = re.sub(r"^#{1,6}\\s+", "", value, flags=re.M)
    value = re.sub(r"\\[([^\\]]+)\\]\\((https?://[^)]+)\\)", r"\\1", value)
    value = value.replace("**", "").replace("---", " ")
    value = re.sub(r"^[-*]\\s+", "", value, flags=re.M)
    return re.sub(r"\\s+", " ", value).strip()

def normalized_title(data):
    raw = source_plain(data.get("title") or "")
    focus = source_plain(data.get("focus_keyword") or "")
    if not raw:
        raw = focus or "Bedrijfsgeheugen"
    if focus and focus.lower() not in raw.lower():
        raw = f"{focus}: {raw}"
    if len(raw) <= 60:
        return raw
    fallback = f"{focus}: praktische uitleg voor het mkb" if focus else raw
    if len(fallback) <= 60:
        return fallback
    trimmed = fallback[:60].rsplit(" ", 1)[0].rstrip(" :,-")
    return trimmed or fallback[:60]

def normalized_meta(data):
    focus = source_plain(data.get("focus_keyword") or "")
    meta = source_plain(data.get("meta_description") or "")
    body = source_plain(data.get("body") or "")
    if focus and focus.lower() not in meta.lower():
        meta = f"{focus}: {meta}".strip()
    candidate = re.sub(r"\\s+", " ", (meta + " " + body).strip())
    if len(meta) >= 140:
        candidate = meta
    if len(candidate) > 160:
        candidate = candidate[:161].rsplit(" ", 1)[0].rstrip(" ,;:-")
    if len(candidate) < 140:
        extra = body
        if extra and extra.lower() not in candidate.lower():
            candidate = (candidate + " " + extra).strip()
            if len(candidate) > 160:
                candidate = candidate[:161].rsplit(" ", 1)[0].rstrip(" ,;:-")
    return candidate

def faq_items(data):
    blocks = [x.strip() for x in re.split(r"\\n\\s*\\n", data.get("body") or "") if x.strip()]
    items = []
    for i, block in enumerate(blocks):
        if not block.startswith("## "):
            continue
        heading = source_plain(block[3:])
        answer = ""
        for nxt in blocks[i + 1:]:
            if nxt.startswith("#"):
                break
            if nxt == "---":
                continue
            answer = source_plain(nxt)
            if answer:
                break
        if heading and answer:
            question = heading if heading.endswith("?") else f"Wat betekent {heading.lower()}?"
            items.append((question, answer[:700]))
        if len(items) == 3:
            break
    return items

def faq_html(data):
    items = faq_items(data)
    if not items:
        return ""
    rows = ['<section class="faq-blok" aria-labelledby="faq-title"><h2 id="faq-title">Veelgestelde vragen</h2>']
    for question, answer in items:
        rows.append(f'<div class="faq-item"><h3>{html.escape(question)}</h3><p>{inline_markdown(answer)}</p></div>')
    rows.append("</section>")
    return "\n".join(rows)

def figures_html(focus):
    label = html.escape(focus or "Het onderwerp")
    return f"""
<figure class="callout"><svg role="img" viewBox="0 0 720 150" width="100%" aria-labelledby="fig1-title"><title id="fig1-title">{label}: van signaal naar vastlegging</title><rect x="10" y="40" width="190" height="70" rx="12" fill="#FBFAF7" stroke="#2742D6" stroke-width="2"/><rect x="265" y="40" width="190" height="70" rx="12" fill="#FBFAF7" stroke="#2742D6" stroke-width="2"/><rect x="520" y="40" width="190" height="70" rx="12" fill="#FBFAF7" stroke="#2742D6" stroke-width="2"/><text x="105" y="82" text-anchor="middle" font-size="18">Signaal</text><text x="360" y="82" text-anchor="middle" font-size="18">Beoordelen</text><text x="615" y="82" text-anchor="middle" font-size="18">Vastleggen</text><path d="M205 75h50M460 75h50" stroke="#2742D6" stroke-width="3"/></svg><figcaption>{label}: maak van een signaal een beoordeelde en vastgelegde bedrijfsbeslissing.</figcaption></figure>
<figure class="callout"><svg role="img" viewBox="0 0 720 150" width="100%" aria-labelledby="fig2-title"><title id="fig2-title">{label}: van regel naar actie</title><rect x="10" y="40" width="190" height="70" rx="12" fill="#FBFAF7" stroke="#FF4F17" stroke-width="2"/><rect x="265" y="40" width="190" height="70" rx="12" fill="#FBFAF7" stroke="#FF4F17" stroke-width="2"/><rect x="520" y="40" width="190" height="70" rx="12" fill="#FBFAF7" stroke="#FF4F17" stroke-width="2"/><text x="105" y="82" text-anchor="middle" font-size="18">Regel</text><text x="360" y="82" text-anchor="middle" font-size="18">Risico</text><text x="615" y="82" text-anchor="middle" font-size="18">Actie</text><path d="M205 75h50M460 75h50" stroke="#FF4F17" stroke-width="3"/></svg><figcaption>{label}: vertaal regels naar een concreet risico en een passende vervolgstap.</figcaption></figure>
"""

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

    focus_plain = source_plain(data.get("focus_keyword") or data.get("title") or "")
    title_plain = normalized_title(data)
    meta_plain = normalized_meta(data)
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
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": question,
                        "acceptedAnswer": {"@type": "Answer", "text": answer},
                    }
                    for question, answer in faq_items(data)
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
        + figures_html(focus_plain)
        + body_html(data)
        + faq_html(data)
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
