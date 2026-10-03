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


def seo_focus(data):
    raw = re.sub(r"\s+", " ", str(data.get("focus_keyword") or "")).strip()
    title = re.sub(r"\s+", " ", str(data.get("title") or "")).strip()
    body = re.sub(r"\s+", " ", str(data.get("body") or "")).strip()
    candidates = [raw]
    words = re.findall(r"[A-Za-zÀ-ÿ0-9]+", title)
    if len(words) >= 2:
        candidates.append(" ".join(words[:2]))
    if words:
        candidates.append(words[0])
    haystack = (title + " " + body).casefold()
    for candidate in candidates:
        if candidate and candidate.casefold() in haystack:
            return candidate
    return "Bedrijfsgeheugen"

def seo_title(title, focus):
    title = re.sub(r"\s+", " ", title).strip()
    if focus.casefold() not in title.casefold():
        title = f"{focus}: {title}"
    if len(title) <= 60:
        return title
    suffixes = ["wat verandert er voor jou?", "wat moet je weten?", "praktisch uitgelegd"]
    for suffix in suffixes:
        candidate = f"{focus}: {suffix}"
        if len(candidate) <= 60:
            return candidate
    return focus[:60].rstrip(" :-")

def seo_meta(meta, focus):
    value = re.sub(r"\s+", " ", meta).strip()
    if focus.casefold() not in value.casefold():
        value = f"{focus}: {value}"
    if len(value) > 160:
        value = value[:157].rsplit(" ", 1)[0].rstrip(" ,.;:-") + "..."
    filler = " Praktische uitleg voor ondernemers en opdrachtgevers."
    while len(value) < 140:
        remaining = 160 - len(value)
        addition = filler[:remaining]
        value = (value + addition).strip()
        if len(addition) == 0:
            break
    if len(value) > 160:
        value = value[:160].rstrip()
    return value

def first_plain_paragraph(body):
    for block in [x.strip() for x in re.split(r"\n\s*\n", body) if x.strip()]:
        if block.startswith("#") or block == "---":
            continue
        plain = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r"\1", block)
        plain = re.sub(r"\*\*([^*]+)\*\*", r"\1", plain)
        plain = re.sub(r"\s+", " ", plain).strip()
        if plain:
            return plain
    return ""

def functional_figures(focus):
    f = html.escape(focus)
    return f"""
<figure class="artikel-figuur">
<svg role="img" viewBox="0 0 720 260" aria-labelledby="fig1title">
<title id="fig1title">{f}: van situatie naar beoordeling</title>
<rect x="20" y="70" width="190" height="110" rx="18" fill="#F4F3EF" stroke="#14171A" stroke-width="2"/>
<rect x="265" y="70" width="190" height="110" rx="18" fill="#EEF1FF" stroke="#2742D6" stroke-width="2"/>
<rect x="510" y="70" width="190" height="110" rx="18" fill="#FFF3EC" stroke="#FF4F17" stroke-width="2"/>
<path d="M210 125H265M455 125H510" stroke="#14171A" stroke-width="3"/>
<text x="115" y="120" text-anchor="middle" font-size="20" font-family="sans-serif">Feitelijke situatie</text>
<text x="360" y="120" text-anchor="middle" font-size="20" font-family="sans-serif">Criteria toetsen</text>
<text x="605" y="120" text-anchor="middle" font-size="20" font-family="sans-serif">Actie vastleggen</text>
</svg>
<figcaption>Gebruik {f} niet als papieren vinkje: beoordeel de feitelijke situatie, toets de criteria en leg de gekozen actie vast.</figcaption>
</figure>
<figure class="artikel-figuur">
<svg role="img" viewBox="0 0 720 260" aria-labelledby="fig2title">
<title id="fig2title">{f}: vier controlepunten</title>
<circle cx="115" cy="125" r="58" fill="#EEF1FF" stroke="#2742D6" stroke-width="2"/>
<circle cx="280" cy="125" r="58" fill="#F4F3EF" stroke="#14171A" stroke-width="2"/>
<circle cx="445" cy="125" r="58" fill="#FFF3EC" stroke="#FF4F17" stroke-width="2"/>
<circle cx="610" cy="125" r="58" fill="#FFF9D6" stroke="#14171A" stroke-width="2"/>
<text x="115" y="132" text-anchor="middle" font-size="18" font-family="sans-serif">Feiten</text>
<text x="280" y="132" text-anchor="middle" font-size="18" font-family="sans-serif">Afspraken</text>
<text x="445" y="132" text-anchor="middle" font-size="18" font-family="sans-serif">Risico</text>
<text x="610" y="132" text-anchor="middle" font-size="18" font-family="sans-serif">Bewijs</text>
</svg>
<figcaption>Vier vaste controlepunten voor {f}: feiten, afspraken, risico en bewijs. Zo blijft de beoordeling reproduceerbaar.</figcaption>
</figure>
"""

def body_html(data):
    blocks = [x.strip() for x in re.split(r"\n\s*\n", data["body"]) if x.strip()]
    if not blocks:
        fail("EMPTY_BLOG_BODY")
    focus_plain = seo_focus(data)
    result = [f"<h2>{html.escape(focus_plain)}: de kern</h2>"]
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
        paragraph = block
        if not lead_written and focus_plain.casefold() not in paragraph.casefold():
            paragraph = f"{focus_plain}: {paragraph}"
        result.append(f"<p{css}>{inline_markdown(paragraph)}</p>")
        lead_written = True
    result.append(functional_figures(focus_plain))
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
    force_regenerate = str(__import__("os").environ.get("POWERHOUSE_BLOG_FORCE_REGENERATE", "")).lower() in ("1","true","yes")
    if target.exists() and not force_regenerate:
        print(f"NO_ACTION:{slug}")
        return

    focus_plain = seo_focus(data)
    title_plain = seo_title(data["title"], focus_plain)
    meta_plain = seo_meta(data["meta_description"], focus_plain)
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
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": f"Wat betekent {focus_plain} in de praktijk?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": first_plain_paragraph(data["body"])[:500],
                        },
                    },
                    {
                        "@type": "Question",
                        "name": f"Waar moet je bij {focus_plain} op letten?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Kijk naar de feitelijke situatie, leg afspraken vast, beoordeel het risico en bewaar bewijs van de gemaakte keuzes.",
                        },
                    },
                ],
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
