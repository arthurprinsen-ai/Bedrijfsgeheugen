#!/usr/bin/env python3
"""Nieuwe pagina aanmelden — sitemap, 301 en melding in het dagplan.

Aanvulling op paginacontrole.yml, die de inhoudelijke SEO al doet (ijzeren regel,
clusterlinks, ankerteksten, browsercontrole). Dit script doet wat daar niet in zit:
een nieuwe pagina in de sitemap zetten, de 301 van .html naar de schone URL
aanmaken, en melden zodra een pagina geen focus-zoekwoord declareert.

Met --volledig draait ook de technische controle, voor los gebruik.

Oorspronkelijke beschrijving:

Draait in GitHub Actions bij elke push naar main. Controleert de pagina's die
in die push zijn gewijzigd of toegevoegd, herstelt zelf wat veilig te herstellen
is (sitemap, 301) en meldt de rest.

Elke publieke pagina moet een focus-zoekwoord declareren:
    <meta name="bg-zoekwoord" content="kennisborging mkb">
Dat zoekwoord moet in de Zoekwoorden-database van Notion staan en mag door
maar één pagina geclaimd worden. Zo blijft de zoekwoordstrategie heel.

Gebruik:
    python3 tools/seo-controle.py            # alleen de gewijzigde pagina's
    python3 tools/seo-controle.py --alles    # de hele site
"""

import json
import os
import re
import subprocess
import sys
import urllib.request

SITE = "https://www.bedrijfsgeheugen.nl"
SITEMAP = "sitemap.xml"
NETLIFY = "netlify.toml"
# Pagina's die geen zoekwoord hoeven te hebben.
VRIJGESTELD = {"404.html", "klantportaal.html", "klantportaal-demo.html",
               "offerte.html", "portaal.html", "bedankt.html"}

FOUT, WAARSCHUWING, HERSTELD = [], [], []


def melden(lijst, pagina, tekst):
    lijst.append(f"{pagina}: {tekst}")


# ── de pagina's ophalen ────────────────────────────────────────────────────
def mag_geindexeerd(pad):
    """Pagina's op noindex horen niet in de sitemap en hebben geen zoekwoord nodig."""
    try:
        h = open(pad, encoding="utf-8", errors="ignore").read(4000)
    except OSError:
        return False
    return "noindex" not in h.lower()


def gewijzigde_paginas():
    if "--alles" in sys.argv:
        return sorted(p for p in os.listdir(".") if p.endswith(".html"))
    bereik = os.environ.get("BEREIK", "HEAD~1 HEAD")
    uit = subprocess.run(["git", "diff", "--name-only", "--diff-filter=AM"]
                         + bereik.split(), capture_output=True, text=True).stdout
    return [p for p in uit.split()
            if p.endswith(".html") and "/" not in p]


def tekst_van(html):
    h = re.sub(r"<(script|style|nav|footer)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


# ── de controles ──────────────────────────────────────────────────────────
def controleer(pad, html, alle_zoekwoorden):
    slug = "/" + pad[:-5] if pad != "index.html" else "/"

    koppen = re.findall(r"<h1[^>]*>(.*?)</h1>", html, flags=re.S | re.I)
    if len(koppen) != 1:
        melden(FOUT, pad, f"{len(koppen)} keer een H1 — het moeten er precies één zijn")

    t = re.search(r"<title>(.*?)</title>", html, flags=re.S)
    titel = re.sub(r"\s+", " ", t.group(1)).strip() if t else ""
    if not 25 <= len(titel) <= 65:
        melden(WAARSCHUWING, pad, f"titel is {len(titel)} tekens (streef naar 25–65)")

    m = re.search(r'<meta name="description" content="(.*?)"', html, flags=re.S)
    oms = m.group(1).strip() if m else ""
    if not 70 <= len(oms) <= 165:
        melden(WAARSCHUWING, pad, f"meta-omschrijving is {len(oms)} tekens (streef naar 70–165)")

    can = re.search(r'<link rel="canonical" href="(.*?)"', html)
    if not can:
        melden(FOUT, pad, "geen canonical")
    elif can.group(1).rstrip("/") != (SITE + slug).rstrip("/"):
        melden(FOUT, pad, f"canonical wijst naar {can.group(1)} in plaats van {SITE}{slug}")

    for tag in ["og:title", "og:description", "og:url", "og:image"]:
        if f'property="{tag}"' not in html:
            melden(WAARSCHUWING, pad, f"{tag} ontbreekt")

    zonder_alt = [i for i in re.findall(r"<img[^>]*>", html) if "alt=" not in i]
    if zonder_alt:
        melden(FOUT, pad, f"{len(zonder_alt)} afbeelding(en) zonder alt-tekst")

    intern = set(re.findall(r'href="(/[a-z0-9/-]+)"', html))
    intern.discard("/")
    if len(intern) < 3:
        melden(WAARSCHUWING, pad, f"maar {len(intern)} interne links in de tekst")

    if "bgkruim" not in html and pad not in ("index.html", "404.html"):
        melden(WAARSCHUWING, pad, "geen kruimelpad")

    # ── het zoekwoord ──
    if pad in VRIJGESTELD or not mag_geindexeerd(pad):
        return
    zw = re.search(r'<meta name="bg-zoekwoord" content="(.*?)"', html)
    if not zw:
        melden(FOUT, pad, 'geen focus-zoekwoord — voeg <meta name="bg-zoekwoord" content="..."> toe')
        return
    woord = zw.group(1).strip()

    claims = alle_zoekwoorden.get(woord.lower(), [])
    if len(claims) > 1:
        melden(FOUT, pad, f'kannibalisatie: "{woord}" wordt ook geclaimd door {", ".join(p for p in claims if p != pad)}')

    body = tekst_van(html).lower()
    kern = woord.lower()
    if kern not in titel.lower():
        melden(WAARSCHUWING, pad, f'zoekwoord "{woord}" staat niet in de titel')
    if kern not in oms.lower():
        melden(WAARSCHUWING, pad, f'zoekwoord "{woord}" staat niet in de meta-omschrijving')
    if kern not in " ".join(body.split()[:120]):
        melden(WAARSCHUWING, pad, f'zoekwoord "{woord}" staat niet in de eerste 120 woorden')
    h2s = " ".join(re.findall(r"<h2[^>]*>(.*?)</h2>", html, flags=re.S | re.I)).lower()
    if kern not in re.sub(r"<[^>]+>", " ", h2s):
        melden(WAARSCHUWING, pad, f'zoekwoord "{woord}" staat in geen enkele H2')


# ── wat we zelf herstellen ────────────────────────────────────────────────
def herstel_sitemap(paden):
    sm = open(SITEMAP, encoding="utf-8").read()
    toe = []
    for pad in paden:
        slug = "/" + pad[:-5]
        if pad in VRIJGESTELD or pad == "index.html" or not mag_geindexeerd(pad):
            continue
        if f"<loc>{SITE}{slug}</loc>" not in sm:
            toe.append(f"<url><loc>{SITE}{slug}</loc><changefreq>monthly</changefreq>"
                       f"<priority>0.7</priority></url>")
    if toe:
        sm = sm.replace("</urlset>", "\n".join(toe) + "\n</urlset>")
        open(SITEMAP, "w", encoding="utf-8").write(sm)
        for r in toe:
            HERSTELD.append("sitemap aangevuld: " + re.search(r"<loc>(.*?)</loc>", r).group(1))


def herstel_redirects(paden):
    nt = open(NETLIFY, encoding="utf-8").read()
    try:
        nt += open("_redirects", encoding="utf-8").read()
    except OSError:
        pass
    toe = ""
    for pad in paden:
        if pad == "index.html" or pad in VRIJGESTELD or not mag_geindexeerd(pad):
            continue
        if f'from = "/{pad}"' not in nt and f"/{pad}" not in nt:
            toe += (f'\n[[redirects]]\n  from = "/{pad}"\n  to = "/{pad[:-5]}"\n'
                    f'  status = 301\n  force = true\n')
            HERSTELD.append(f"301 toegevoegd: /{pad} → /{pad[:-5]}")
    if toe:
        open(NETLIFY, "w", encoding="utf-8").write(nt.rstrip() + "\n" + toe)


# ── melden ────────────────────────────────────────────────────────────────
def naar_notion(paden):
    haak = os.environ.get("BG_SEO_WEBHOOK")
    if not haak or not (FOUT or WAARSCHUWING):
        return
    lading = {
        "paginas": ", ".join(paden),
        "fouten": "\n".join(FOUT) or "geen",
        "waarschuwingen": "\n".join(WAARSCHUWING) or "geen",
        "hersteld": "\n".join(HERSTELD) or "niets",
        "aantal_fouten": len(FOUT),
    }
    req = urllib.request.Request(haak, data=json.dumps(lading).encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=20).read()
    except Exception as e:
        print("melden aan Notion mislukt:", e)


def main():
    paden = gewijzigde_paginas()
    if not paden:
        print("Geen gewijzigde pagina's.")
        return 0

    alle = {}
    for p in os.listdir("."):
        if p.endswith(".html"):
            zw = re.search(r'<meta name="bg-zoekwoord" content="(.*?)"',
                           open(p, encoding="utf-8", errors="ignore").read())
            if zw:
                alle.setdefault(zw.group(1).strip().lower(), []).append(p)

    if "--volledig" in sys.argv:
        for pad in paden:
            controleer(pad, open(pad, encoding="utf-8").read(), alle)
    else:
        # alleen het zoekwoord: de rest doet paginacontrole.yml
        import re as _re
        for pad in paden:
            if pad in VRIJGESTELD or not mag_geindexeerd(pad):
                continue
            h = open(pad, encoding="utf-8").read()
            zw = _re.search(r'<meta name="bg-zoekwoord" content="(.*?)"', h)
            if not zw:
                melden(FOUT, pad, 'geen focus-zoekwoord — voeg '
                       '<meta name="bg-zoekwoord" content="..."> toe en zet het '
                       'woord in de Zoekwoorden-database')
            else:
                claims = alle.get(zw.group(1).strip().lower(), [])
                if len(claims) > 1:
                    melden(FOUT, pad, f'kannibalisatie: "{zw.group(1)}" wordt ook '
                           f'geclaimd door {", ".join(q for q in claims if q != pad)}')
    herstel_sitemap(paden)
    herstel_redirects(paden)

    print("Gecontroleerd:", ", ".join(paden))
    for kop, lijst in (("ZELF HERSTELD", HERSTELD), ("FOUT", FOUT), ("LET OP", WAARSCHUWING)):
        if lijst:
            print(f"\n{kop}:")
            for r in lijst:
                print("  -", r)
    naar_notion(paden)
    return 1 if FOUT else 0


if __name__ == "__main__":
    sys.exit(main())
