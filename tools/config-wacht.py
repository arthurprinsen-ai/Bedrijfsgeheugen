# -*- coding: utf-8 -*-
"""Configuratiewacht.

Aanleiding, 20 augustus 2026: de complete inhoud van _redirects was twee keer
in netlify.toml geplakt door de SEO-poortwachter. Netlify kwam daardoor niet
verder dan "Reading and parsing configuration files" en elke build faalde -
uren achtereen, zonder dat iemand het merkte, terwijl de commits gewoon
doorliepen. De site bleef op de laatste geslaagde versie staan.

Deze wacht kijkt bij elke push of de configuratiebestanden nog leesbaar zijn.
Faalt hij, dan is er iets mis met de configuratie - niet met de inhoud.
"""

import sys
import re
import xml.etree.ElementTree as ET

try:
    import tomllib
except ImportError:  # Python < 3.11
    tomllib = None

FOUTEN = []
GOED = []

# Een platte _redirects-regel: begint met / of http, daarna spaties en nog een pad.
PLAT = re.compile(r'^\s*(/|https?://)\S+\s+\S+', re.MULTILINE)


def netlify_toml():
    naam = "netlify.toml"
    try:
        rauw = open(naam, "rb").read()
    except OSError:
        GOED.append(f"{naam} bestaat niet - overgeslagen")
        return

    tekst = rauw.decode("utf-8", "replace")

    # 1. Platte redirect-regels horen hier niet. Dit is de fout van 20 augustus.
    plat = []
    for nr, regel in enumerate(tekst.split("\n"), 1):
        kaal = regel.strip()
        if not kaal or kaal.startswith("#"):
            continue
        if kaal.startswith("/") and "=" not in kaal and len(kaal.split()) >= 2:
            plat.append(f"regel {nr}: {kaal[:70]}")
    if plat:
        FOUTEN.append(
            f"{naam} bevat {len(plat)} regel(s) in _redirects-vorm. Die horen in "
            f"het bestand _redirects, niet hier. Netlify kan de configuratie dan "
            f"niet lezen en elke build faalt.\n    " + "\n    ".join(plat[:8])
        )

    # 2. Is het uberhaupt geldige TOML?
    if tomllib is None:
        GOED.append("tomllib niet beschikbaar - TOML niet gecontroleerd")
        return
    try:
        data = tomllib.loads(tekst)
    except Exception as fout:
        FOUTEN.append(f"{naam} is geen geldige TOML: {fout}")
        return

    aantal = len(data.get("redirects", []))
    edge = len(data.get("edge_functions", []))
    GOED.append(f"{naam} leesbaar - {aantal} redirects, {edge} edge function(s)")

    # 3. Het slot op /intern moet blijven staan.
    if not any(e.get("path") == "/intern/*" for e in data.get("edge_functions", [])):
        FOUTEN.append(
            "Het slot op /intern/* staat niet meer in netlify.toml. Zonder die "
            "edge function is de interne map voor iedereen met de link te openen."
        )


def redirects_bestand():
    naam = "_redirects"
    try:
        tekst = open(naam, encoding="utf-8").read()
    except OSError:
        GOED.append(f"{naam} bestaat niet - overgeslagen")
        return
    if "[[redirects]]" in tekst or re.search(r'^\s*from\s*=', tekst, re.MULTILINE):
        FOUTEN.append(
            f"{naam} bevat TOML-blokken. Andersom dus: die horen in netlify.toml. "
            f"Netlify negeert ze hier stilzwijgend, waardoor een 301 niet werkt."
        )
        return
    regels = [r for r in tekst.split("\n") if r.strip() and not r.strip().startswith("#")]
    GOED.append(f"{naam} leesbaar - {len(regels)} regels")


def sitemap():
    naam = "sitemap.xml"
    try:
        rauw = open(naam, "rb").read()
    except OSError:
        GOED.append(f"{naam} bestaat niet - overgeslagen")
        return
    try:
        boom = ET.fromstring(rauw)
    except Exception as fout:
        FOUTEN.append(f"{naam} is geen geldige XML: {fout}")
        return
    locs = [e.text for e in boom.iter() if e.tag.endswith("loc")]
    dubbel = {l for l in locs if locs.count(l) > 1}
    if dubbel:
        FOUTEN.append(f"{naam} bevat dubbele URL's: " + ", ".join(sorted(dubbel)[:5]))
    GOED.append(f"{naam} leesbaar - {len(locs)} URL's")


def alarmen_met_inhoud():
    """Elk alarm moet zeggen wat er mis is.

    Aanleiding, 20 augustus 2026: de paginacontrole werd rood op een regel uit
    het rapport, terwijl er geen melding werd aangemaakt. Je kreeg dus een mail
    'All jobs have failed' zonder dat ergens stond wat er aan de hand was. Het
    slechtste van twee werelden: een alarm zonder inhoud wordt weggeklikt, en
    dan mis je het alarm dat er wel toe doet.

    Regel: een workflow die zichzelf rood kan maken, moet in dezelfde run ook
    een melding kunnen aanmaken of bijwerken. Anders is het alarm inhoudsloos.
    """
    import glob

    zonder = []
    for pad in sorted(glob.glob(".github/workflows/*.yml")):
        try:
            tekst = open(pad, encoding="utf-8").read()
        except OSError:
            continue
        kan_falen = "exit 1" in tekst
        # Twee manieren om te zeggen wat er mis is: een melding in GitHub, of
        # een ::error::-annotatie die in de samenvatting en de mail terechtkomt.
        zegt_wat = (
            "issues.create" in tekst
            or "issues.update" in tekst
            or "::error::" in tekst
        )
        if kan_falen and not zegt_wat:
            zonder.append(pad)

    if zonder:
        FOUTEN.append(
            "Deze workflows kunnen rood worden zonder ergens te vertellen wat er mis "
            "is. Voeg een melding toe, of laat ze niet falen:\n    " + "\n    ".join(zonder)
        )
    else:
        GOED.append("alle workflows die kunnen falen, maken ook een melding met de reden")


def main():
    netlify_toml()
    redirects_bestand()
    sitemap()
    alarmen_met_inhoud()

    print("## Configuratiewacht\n")
    for g in GOED:
        print(f"- {g}")
    if FOUTEN:
        print("\n**Er is iets mis met de configuratie. De site komt zo niet live.**\n")
        for f in FOUTEN:
            print(f"- {f}")
        return 1
    print("\nAlles leesbaar. Netlify kan hiermee bouwen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
