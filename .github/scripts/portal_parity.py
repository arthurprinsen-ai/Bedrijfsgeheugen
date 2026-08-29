#!/usr/bin/env python3
"""Fail closed when protected customer-portal baseline capabilities disappear.

This is intentionally dependency-free so it can run in CI and locally.
It is a baseline guard, not a replacement for browser/runtime parity tests.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PORTAL = ROOT / "klantportaal.html"

PANEL_TABS = {
    "overzicht", "profiel", "dataai", "aiscan", "invoeren", "antwoorden",
    "business", "cijfers", "waarde", "mensen", "branche", "onderzoek",
    "beleid", "aicap", "strategie", "canvassen", "eindconclusie", "dd",
    "dna", "bijhouden", "wijzigingen", "advies", "offerte", "roadmap",
}

GLOBAL_MARKERS = {
    "Netlify Identity": "netlify-identity-widget.js",
    "logout": "netlifyIdentity.logout()",
    "export": 'id="btnExport"',
    "import": 'id="btnImport"',
    "print permission gate": "vraagToegang(function(){window.print();})",
    "feedback": 'id="fbKnop"',
    "customer branding": 'id="klantMerk"',
    "mobile navigation": 'class="onderbalk"',
}

OVERVIEW_MARKERS = {
    "maturity": 'id="kNiveau"',
    "manual work annual": 'id="kKosten"',
    "fte": 'id="kFte"',
    "company state": 'id="staat"',
    "cmmi": 'id="ovCmmiGraf"',
    "adoption curve": 'id="curveMini"',
    "leakage": 'id="taart"',
    "blockers": 'id="remmen"',
    "progress": 'id="voortgang"',
    "advice": 'id="adviesTop"',
}

SEMANTIC_MARKERS = {
    "capacity-not-cash wording": "Geen geld dat vrijkomt, wel ruimte die je terugkrijgt.",
    "46-week annualization": "46 weken",
}


def fail(message: str) -> None:
    print(f"PARITY FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    if not PORTAL.exists():
        fail(f"missing protected portal file: {PORTAL.relative_to(ROOT)}")

    html = PORTAL.read_text(encoding="utf-8")

    tabs = set(re.findall(r'data-p="([^"]+)"', html))
    missing_tabs = sorted(PANEL_TABS - tabs)
    if missing_tabs:
        fail(f"protected navigation keys disappeared: {', '.join(missing_tabs)}")

    panel_ids = set(re.findall(r'id="p-([^"]+)"', html))
    missing_panels = sorted(PANEL_TABS - panel_ids)
    if missing_panels:
        fail(f"protected panels disappeared: {', '.join(missing_panels)}")

    for label, marker in {**GLOBAL_MARKERS, **OVERVIEW_MARKERS, **SEMANTIC_MARKERS}.items():
        if marker not in html:
            fail(f"protected capability/meaning disappeared: {label} ({marker!r})")

    print(
        "PARITY GREEN: "
        f"{len(PANEL_TABS)} protected panels, "
        f"{len(GLOBAL_MARKERS)} global capabilities, "
        f"{len(OVERVIEW_MARKERS)} overview capabilities and "
        f"{len(SEMANTIC_MARKERS)} semantic invariants present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
