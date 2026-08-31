#!/usr/bin/env python3
"""Validate the committed SEO keyword/funnel strategy."""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STRATEGY = ROOT / "seo" / "keyword-strategy.json"
SITEMAP = ROOT / "sitemap.xml"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
BASE = "https://www.bedrijfsgeheugen.nl"


def main() -> int:
    errors: list[str] = []
    data = json.loads(STRATEGY.read_text(encoding="utf-8"))
    sitemap = {
        (n.findtext("sm:loc", default="", namespaces=NS) or "").strip()
        for n in ET.parse(SITEMAP).findall("sm:url", NS)
    }

    if data.get("north_star", {}).get("revenue_12m_eur_ambition") != 1000000:
        errors.append("12-month revenue ambition is missing or changed without an explicit strategy update")

    owners: defaultdict[str, list[str]] = defaultdict(list)
    clusters = data.get("priority_clusters", [])
    if not clusters:
        errors.append("priority_clusters is empty")

    for cluster in clusters:
        name = cluster.get("cluster", "<unnamed>")
        pillar = cluster.get("pillar", "")
        primary = cluster.get("primary_keyword", "").strip().casefold()
        intent = cluster.get("intent", "")
        cta = cluster.get("primary_cta", "")
        if not pillar or BASE + pillar not in sitemap:
            errors.append(f"{name}: pillar is not an indexable sitemap URL: {pillar}")
        if not primary:
            errors.append(f"{name}: missing primary_keyword")
        else:
            owners[primary].append(pillar)
        if not intent:
            errors.append(f"{name}: missing search intent")
        if not cta:
            errors.append(f"{name}: missing conversion CTA")
        for support in cluster.get("supporting_content", []):
            full = BASE + support
            if full not in sitemap:
                errors.append(f"{name}: supporting content is not indexable: {support}")

    for keyword, pages in owners.items():
        if len(pages) > 1:
            errors.append(f"primary keyword has multiple owners: {keyword} -> {pages}")

    contracts = data.get("anti_cannibalisation_contract", [])
    seen_pages = set()
    for item in contracts:
        commercial = item.get("commercial_page")
        informational = item.get("informational_page")
        if commercial == informational:
            errors.append(f"anti-cannibalisation contract maps same page twice: {commercial}")
        for p in (commercial, informational):
            if not p:
                errors.append("anti-cannibalisation contract has empty page")
            elif BASE + p not in sitemap:
                errors.append(f"anti-cannibalisation page is not indexable: {p}")
            seen_pages.add(p)
        if not item.get("owns") or not item.get("owns_long_tail"):
            errors.append(f"anti-cannibalisation contract missing keyword ownership: {item}")

    required = set(data.get("content_contract", {}).get("required_for_new_seo_landing_page", []))
    must = {"one_primary_search_intent", "unique_primary_keyword", "canonical", "one_h1", "internal_links_in", "conversion_cta", "measurement_event"}
    missing = must - required
    if missing:
        errors.append(f"content contract missing mandatory controls: {sorted(missing)}")

    print(f"Keyword Strategy Guardian: {len(clusters)} priority clusters, {len(contracts)} anti-cannibalisation contracts")
    if errors:
        for error in errors:
            print(f"::error::{error}")
        return 1
    print("PASS: keyword ownership, intent and funnel strategy are internally consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
