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
TEMPLATE = ROOT / "blog" / "instagram-groeikalender-v2-hoe-mira-dagelijks-scoort-tot-31-12-2026" / "index.html"
BLOG_INDEX = ROOT / "blog" / "index.html"
RSS = ROOT / "blog" / "rss.xml"
SITEMAP = ROOT / "sitemap.xml"
ORIGIN = "https://www.bedrijfsgeheugen.nl"
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

def clip_words(value, max_len):
    value = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(value) <= max_len:
        return value
    cut = value[:max_len + 1].rsplit(" ", 1)[0].rstrip(" ,;:-")
    return cut or value[:max_len]

def seo_title(title, focus):
    title = re.sub(r"\s+", " ", str(title or "")).strip()
    focus = re.sub(r"\s+", " ", str(focus or "")).strip()
    candidate = title
    if focus and focus.lower() not in candidate.lower():
        candidate = f"{focus}: {candidate}"
    if len(candidate) <= 60:
        return candidate
    # Keep the exact focus phrase; truncate only the explanatory tail.
    if focus and len(focus) <= 60:
        tail = candidate[len(focus):].lstrip(" :—-")
        room = 60 - len(focus) - 2
        short_tail = clip_words(tail, max(0, room))
        return focus if not short_tail else f"{focus}: {short_tail}"
    return clip_words(candidate, 60)

def seo_meta(meta, focus, title):
    value = re.sub(r"\s+", " ", str(meta or title or "")).strip()
    focus = re.sub(r"\s+", " ", str(focus or "")).strip()
    if focus and focus.lower() not in value.lower():
        value = f"{focus.capitalize()}: {value}"
    suffixes = [
        " Lees de praktische aanpak en volgende stap voor het mkb.",
        " Met concrete aandachtspunten voor processen, eigenaarschap en overdraagbaarheid.",
    ]
    for suffix in suffixes:
        if len(value) >= 140:
            break
        value += suffix
    if len(value) > 160:
        value = clip_words(value, 157).rstrip(" .") + "..."
    if len(value) < 140:
        value = (value + " Praktische uitleg voor Nederlandse mkb-bedrijven.").strip()
        if len(value) > 160:
            value = clip_words(value, 157).rstrip(" .") + "..."
    return value

def svg_figure(title, left, right, caption):
    return (
        '<figure>'
        f'<svg role="img" viewBox="0 0 640 240" aria-label="{html.escape(title, quote=True)}">'
        f'<title>{html.escape(title)}</title>'
        '<rect x="25" y="65" width="240" height="110" rx="16" fill="none" stroke="currentColor"/>'
        f'<text x="145" y="125" text-anchor="middle">{html.escape(left)}</text>'
        '<path d="M280 120h75" stroke="currentColor" stroke-width="3"/>'
        '<path d="M340 108l16 12-16 12" fill="none" stroke="currentColor" stroke-width="3"/>'
        '<rect x="375" y="65" width="240" height="110" rx="16" fill="none" stroke="currentColor"/>'
        f'<text x="495" y="125" text-anchor="middle">{html.escape(right)}</text>'
        '</svg>'
        f'<figcaption>{html.escape(caption)}</figcaption>'
        '</figure>'
    )

def faq_items(data, focus, meta):
    cta = str(data.get("cta") or "").strip()
    return [
        (
            f"Waar gaat {focus} in dit artikel over?",
            meta,
        ),
        (
            f"Hoe begin je met {focus}?",
            "Begin bij één concreet proces of probleem uit het artikel. Leg de huidige werkwijze, uitzonderingen en eigenaar vast voordat je gaat verbeteren.",
        ),
        (
            "Wat is een logische volgende stap?",
            cta or "Kies één concreet proces en bepaal welke kennis, overdracht of automatisering aantoonbaar beter moet worden.",
        ),
    ]

def body_html(data, focus, meta):
    blocks = [x.strip() for x in re.split(r"\n\s*\n", data["body"]) if x.strip()]
    if not blocks:
        fail("EMPTY_BLOG_BODY")
    result = [
        f'<p class="lead"><strong>{html.escape(focus)}</strong> staat centraal in dit artikel. {html.escape(blocks[0])}</p>',
        f'<h2>{html.escape(focus)}: waarom dit aandacht verdient</h2>',
        svg_figure(
            f"Van huidige situatie naar {focus}",
            "Huidige situatie",
            "Geborgde aanpak",
            f"Maak bij {focus} expliciet wat nu impliciet in het werk zit.",
        ),
    ]
    if len(blocks) > 1:
        result.append(f"<p>{html.escape(blocks[1])}</p>")
    result.extend([
        f'<h2 data-bg-evidence="praktijkmethode">Hoe {html.escape(focus)} in de praktijk werkt</h2>',
        "<ul><li>Leg de huidige werkwijze vast.</li><li>Maak uitzonderingen en beslisregels zichtbaar.</li><li>Wijs een eigenaar en meetbare vervolgstap aan.</li></ul>",
    ])
    if len(blocks) > 2:
        result.append(f"<p>{html.escape(blocks[2])}</p>")
    result.append(
        svg_figure(
            f"Dagelijkse lus voor {focus}",
            "Beslissing",
            "Hergebruik",
            f"Borg {focus} tijdens het werk, zodat kennis en beslissingen later opnieuw bruikbaar zijn.",
        )
    )
    headings = ["Wat vaak te laat gebeurt", "Wat wél helpt", "Wat dit betekent voor continuïteit"]
    for i, block in enumerate(blocks[3:]):
        if i < len(headings):
            result.append(f"<h2>{headings[i]}</h2>")
        result.append(f"<p>{html.escape(block)}</p>")
    if data.get("cta"):
        result.append(
            '<p class="artikel-cta">'
            + html.escape(data["cta"])
            + f' <a href="{ORIGIN}/frisse-blik">Bekijk de Frisse blik &rarr;</a></p>'
        )
    result.append(
        f'<p>Verder lezen: <a href="{ORIGIN}/bedrijfsgeheugen">wat een bedrijfsgeheugen doet</a>, '
        f'<a href="{ORIGIN}/zelfscan">doe de zelfscan</a> of '
        f'<a href="{ORIGIN}/prijzen">bekijk de prijsopbouw</a>.</p>'
    )
    faqs = faq_items(data, focus, meta)
    result.append('<section class="faq-blok"><h2>Veelgestelde vragen</h2>')
    for q, a in faqs:
        result.append(f'<div class="faq-item"><h3>{html.escape(q)}</h3><p>{html.escape(a)}</p></div>')
    result.append("</section>")
    return "\n".join(result), faqs

def structured_data(data, canonical, title, meta, focus, business_date, faqs):
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": title,
                "description": meta,
                "datePublished": business_date,
                "dateModified": business_date,
                "inLanguage": "nl-NL",
                "mainEntityOfPage": canonical,
                "author": {"@type": "Person", "name": "Arthur Prinsen", "url": f"{ORIGIN}/over-ons"},
                "publisher": {"@id": f"{ORIGIN}/#org"},
                "articleSection": "Powerhouse dagelijkse learning",
                "keywords": focus,
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a},
                    }
                    for q, a in faqs
                ],
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{ORIGIN}/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{ORIGIN}/blog/"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": canonical},
                ],
            },
        ],
    }

def replace_or_add_meta(text, attr_name, attr_value, content):
    tag = f'<meta {attr_name}="{attr_value}" content="{html.escape(content, quote=True)}">'
    pattern = rf'<meta\b[^>]*{attr_name}=["\']{re.escape(attr_value)}["\'][^>]*>'
    if re.search(pattern, text, re.I):
        return re.sub(pattern, tag, text, count=1, flags=re.I)
    return text.replace("</head>", tag + "\n</head>", 1)

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

    focus = re.sub(r"\s+", " ", str(data.get("focus_keyword") or "bedrijfsgeheugen")).strip()
    title = seo_title(data["title"], focus)
    meta = seo_meta(data.get("meta_description"), focus, title)
    canonical = f"{ORIGIN}/blog/{slug}/"

    template = TEMPLATE.read_text(encoding="utf-8")
    template = replace_one(template, r"<title>.*?</title>", f"<title>{html.escape(title)}</title>", "title")
    template = replace_one(
        template,
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{html.escape(meta, quote=True)}">',
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
    template = replace_or_add_meta(template, "name", "bg-zoekwoord", focus)
    template = replace_or_add_meta(template, "property", "og:title", title)
    template = replace_or_add_meta(template, "property", "og:description", meta)
    template = replace_or_add_meta(template, "property", "og:url", canonical)
    template = replace_one(
        template,
        r'(<span aria-current="page">).*?(</span>)',
        rf'\1{html.escape(title)}\2',
        "breadcrumb",
    )

    content, faqs = body_html(data, focus, meta)
    article = (
        f'<article class="artikel" data-content-id="{html.escape(data["content_id"], quote=True)}">'
        f'<div class="artikelkop"><span class="eyebrow">Powerhouse · Dagelijkse learning</span>'
        f'<h1>{html.escape(title)}</h1><div class="artikelmeta"><span>{business_date[8:10]}-{business_date[5:7]}-{business_date[:4]}</span>'
        f' · <span>Arthur Prinsen</span></div></div>'
        + content
        + "</article>"
    )
    template = replace_one(template, r'<article class="artikel"[^>]*>.*?</article>', article, "article")

    # Replace template structured data with the exact article graph.
    template = re.sub(
        r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>',
        "",
        template,
        flags=re.I | re.S,
    )
    ld = json.dumps(structured_data(data, canonical, title, meta, focus, business_date, faqs), ensure_ascii=False, separators=(",", ":"))
    template = template.replace("</head>", f'<script type="application/ld+json">{ld}</script>\n</head>', 1)

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(template, encoding="utf-8")

    index_text = BLOG_INDEX.read_text(encoding="utf-8")
    href = f"/blog/{slug}/"
    if href not in index_text:
        excerpt_raw = re.sub(r"\s+", " ", data["body"]).strip()
        excerpt = html.escape(excerpt_raw[:220] + ("…" if len(excerpt_raw) > 220 else ""))
        card = (
            f'  <a class="kaart" href="{href}"><span class="tag">Powerhouse</span><h2>{html.escape(title)}</h2>'
            f'<p>{excerpt}</p><span class="lees">Lees het artikel &rarr;</span>'
            f'<span class="datum">{business_date[8:10]}-{business_date[5:7]}-{business_date[:4]} &middot; nieuw</span></a>\n\n'
        )
        index_text = index_text.replace('<div class="artikelen">\n', '<div class="artikelen">\n\n' + card, 1)
        BLOG_INDEX.write_text(index_text, encoding="utf-8")

    rss = RSS.read_text(encoding="utf-8")
    if canonical not in rss:
        pub_date = format_datetime(dt.datetime.now(dt.timezone.utc))
        item = (
            f'<item><title>{html.escape(title)}</title><link>{canonical}</link><guid>{canonical}</guid>'
            f'<pubDate>{pub_date}</pubDate><description>{html.escape(meta)}</description></item>\n\n'
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
        "seo_title": title,
        "meta_description": meta,
        "focus_keyword": focus,
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
