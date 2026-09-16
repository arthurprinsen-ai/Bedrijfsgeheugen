#!/usr/bin/env python3
"""Fail closed when protected customer-portal parity coverage disappears.

The legacy portal remains the immutable migration baseline. Portal V2 must keep
both the complete functional inventory and an executable implementation/evidence
gate; a contract or navigation entry alone is never accepted as proof of parity.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PORTAL = ROOT / "klantportaal.html"
V2_FUNCTIONAL_INVENTORY = ROOT / "portal-v2" / "legacy-functional-inventory.js"
V2_PARITY_GATE = ROOT / "portal-v2" / "parity-gate.js"
V2_PARITY_TEST = ROOT / "portal-v2" / "tests" / "parity-gate.test.mjs"

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

FUNCTIONAL_ARRAY_KEYS = ("fields", "models", "calculations", "actions", "dependencies")


def fail(message: str) -> None:
    print(f"PARITY FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def check_v2_functional_inventory() -> None:
    if not V2_FUNCTIONAL_INVENTORY.exists():
        fail(f"missing V2 functional inventory: {V2_FUNCTIONAL_INVENTORY.relative_to(ROOT)}")

    source = V2_FUNCTIONAL_INVENTORY.read_text(encoding="utf-8")
    if "LEGACY_FUNCTIONAL_INVENTORY" not in source or "assertFunctionalInventoryComplete" not in source:
        fail("V2 functional inventory export/guard disappeared")

    missing = []
    for capability in sorted(PANEL_TABS):
        if not re.search(rf"^\s*{re.escape(capability)}\s*:\s*capability\(", source, re.MULTILINE):
            missing.append(capability)
    if missing:
        fail(f"V2 functional inventory misses protected capabilities: {', '.join(missing)}")

    for key in FUNCTIONAL_ARRAY_KEYS:
        if key not in source:
            fail(f"V2 functional inventory no longer records {key}")

    for marker in (
        "capacity-not-cash",
        "46-week-annualization",
        "authenticated-customer-context",
        "permission-gated-print",
        "customer-branding",
        "mobile-navigation",
    ):
        if marker not in source:
            fail(f"V2 functional inventory lost protected meaning/capability: {marker}")


def check_v2_implementation_gate() -> None:
    if not V2_PARITY_GATE.exists():
        fail("missing executable V2 implementation parity gate")
    if not V2_PARITY_TEST.exists():
        fail("missing fail-closed V2 parity-gate tests")
    source = V2_PARITY_GATE.read_text(encoding="utf-8")
    test_source = V2_PARITY_TEST.read_text(encoding="utf-8")
    for marker in (
        "LEGACY_FUNCTIONAL_INVENTORY",
        "listFunctionalContracts",
        "capabilityImplementationCoverage",
        "evaluatePortalParity",
        "production-evidence",
        "persistence",
        "calculationsOwner",
        "actionsOwner",
        "dependenciesOwner",
    ):
        if marker not in source:
            fail(f"V2 implementation parity gate lost protected marker: {marker}")
    for marker in ("all protected legacy capabilities", "fails closed", "all 24 capabilities verified"):
        if marker not in test_source:
            fail(f"V2 implementation parity test lost protected assertion: {marker}")


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

    check_v2_functional_inventory()
    check_v2_implementation_gate()

    print(
        "PARITY GREEN: "
        f"{len(PANEL_TABS)} protected legacy panels, "
        f"{len(GLOBAL_MARKERS)} global capabilities, "
        f"{len(OVERVIEW_MARKERS)} overview capabilities, "
        f"{len(SEMANTIC_MARKERS)} semantic invariants, "
        f"{len(PANEL_TABS)} V2 functional inventory records and executable implementation/evidence gate present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
