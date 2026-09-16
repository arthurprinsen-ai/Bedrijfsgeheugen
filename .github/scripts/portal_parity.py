#!/usr/bin/env python3
"""Fail closed when protected customer-portal parity coverage disappears.

The legacy portal remains the immutable migration baseline. Portal V2 must keep
both the complete functional inventory and an executable implementation/evidence
gate; a contract or navigation entry alone is never accepted as proof of parity.

The gate deliberately derives editable-field and explicit-button coverage from
the legacy DOM source. That prevents a hand-maintained V2 inventory from silently
omitting legacy state or user actions while still reporting itself as complete.
"""
from __future__ import annotations

import re
import sys
from fnmatch import fnmatchcase
from html.parser import HTMLParser
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
EDITABLE_TAGS = {"input", "select", "textarea"}
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
CAPABILITY_DECL = re.compile(r"^\s*([a-z][\w-]*)\s*:\s*capability\(", re.MULTILINE)


def fail(message: str) -> None:
    print(f"PARITY FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


class LegacyPanelParser(HTMLParser):
    """Collect editable element and explicit button ids by protected panel."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.current_panel: str | None = None
        self.stack: list[tuple[str, str | None]] = []
        self.fields: dict[str, set[str]] = {name: set() for name in PANEL_TABS}
        self.actions: dict[str, set[str]] = {name: set() for name in PANEL_TABS}

    def _collect(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        element_id = attrs_dict.get("id") or ""
        if element_id.startswith("p-"):
            candidate = element_id[2:]
            if candidate in PANEL_TABS:
                self.current_panel = candidate
        if tag in EDITABLE_TAGS and self.current_panel and element_id:
            self.fields[self.current_panel].add(element_id)
        if tag == "button" and self.current_panel and element_id:
            self.actions[self.current_panel].add(element_id)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag not in VOID_TAGS:
            self.stack.append((tag, self.current_panel))
        self._collect(tag, attrs)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._collect(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, -1, -1):
            open_tag, previous_panel = self.stack[index]
            if open_tag == tag:
                del self.stack[index:]
                self.current_panel = previous_panel
                return


def parse_legacy_panels(html: str) -> LegacyPanelParser:
    parser = LegacyPanelParser()
    parser.feed(html)
    parser.close()
    return parser


def derive_legacy_editable_fields(html: str) -> dict[str, set[str]]:
    return parse_legacy_panels(html).fields


def derive_legacy_action_ids(html: str) -> dict[str, set[str]]:
    return parse_legacy_panels(html).actions


def capability_segments(source: str) -> dict[str, str]:
    matches = list(CAPABILITY_DECL.finditer(source))
    segments: dict[str, str] = {}
    for index, match in enumerate(matches):
        capability = match.group(1)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(source)
        segments[capability] = source[match.start():end]
    return segments


def split_top_level_args(expression: str) -> list[str]:
    start = expression.find("capability(")
    if start < 0:
        return []
    text = expression[start + len("capability("):]
    args: list[str] = []
    token: list[str] = []
    depth = 0
    quote: str | None = None
    escaped = False
    for char in text:
        if quote:
            token.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in ("'", '"', "`"):
            quote = char
            token.append(char)
            continue
        if char in "[({":
            depth += 1
            token.append(char)
            continue
        if char in "]}":
            depth = max(0, depth - 1)
            token.append(char)
            continue
        if char == ")" and depth == 0:
            if token:
                args.append("".join(token).strip())
            break
        if char == ")":
            depth = max(0, depth - 1)
            token.append(char)
            continue
        if char == "," and depth == 0:
            args.append("".join(token).strip())
            token = []
            continue
        token.append(char)
    return args


def inventory_field_patterns(segment: str) -> set[str]:
    patterns = set(re.findall(r"legacyFieldId\s*:\s*['\"]([^'\"]+)['\"]", segment))
    args = split_top_level_args(segment)
    if len(args) > 1:
        for ids_args in re.findall(r"\bids\((.*?)\)", args[1], re.DOTALL):
            patterns.update(re.findall(r"['\"]([^'\"]+)['\"]", ids_args))
    return patterns


def inventory_action_patterns(segment: str) -> set[str]:
    args = split_top_level_args(segment)
    if len(args) <= 4:
        return set()
    return set(re.findall(r"['\"]([^'\"]+)['\"]", args[4]))


def matches_contract(item_id: str, patterns: set[str]) -> bool:
    return any(fnmatchcase(item_id, pattern) for pattern in patterns)


def check_source_derived_field_parity(html: str, inventory_source: str) -> int:
    fields_by_panel = derive_legacy_editable_fields(html)
    segments = capability_segments(inventory_source)
    protected_count = 0
    missing: list[str] = []

    for panel in sorted(PANEL_TABS):
        fields = sorted(fields_by_panel.get(panel, set()))
        protected_count += len(fields)
        patterns = inventory_field_patterns(segments.get(panel, ""))
        for field_id in fields:
            if not matches_contract(field_id, patterns):
                missing.append(f"{panel}.{field_id}")

    if missing:
        fail(
            "legacy editable fields have no V2 field contract: "
            + ", ".join(missing)
            + ". Add an exact or explicit wildcard legacyFieldId contract; do not delete the legacy field to make this green."
        )
    return protected_count


def check_source_derived_action_parity(html: str, inventory_source: str) -> int:
    actions_by_panel = derive_legacy_action_ids(html)
    segments = capability_segments(inventory_source)
    protected_count = 0
    missing: list[str] = []

    for panel in sorted(PANEL_TABS):
        actions = sorted(actions_by_panel.get(panel, set()))
        protected_count += len(actions)
        patterns = inventory_action_patterns(segments.get(panel, ""))
        for action_id in actions:
            if not matches_contract(action_id, patterns):
                missing.append(f"{panel}.{action_id}")

    if missing:
        fail(
            "legacy button actions have no V2 action contract: "
            + ", ".join(missing)
            + ". Add an exact or explicit wildcard action contract; do not delete the legacy action to make this green."
        )
    return protected_count


def check_v2_functional_inventory(source: str) -> None:
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
    if not V2_FUNCTIONAL_INVENTORY.exists():
        fail(f"missing V2 functional inventory: {V2_FUNCTIONAL_INVENTORY.relative_to(ROOT)}")

    html = PORTAL.read_text(encoding="utf-8")
    inventory_source = V2_FUNCTIONAL_INVENTORY.read_text(encoding="utf-8")

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

    check_v2_functional_inventory(inventory_source)
    protected_fields = check_source_derived_field_parity(html, inventory_source)
    protected_actions = check_source_derived_action_parity(html, inventory_source)
    check_v2_implementation_gate()

    print(
        "PARITY GREEN: "
        f"{len(PANEL_TABS)} protected legacy panels, "
        f"{protected_fields} source-derived editable legacy fields, "
        f"{protected_actions} source-derived legacy button actions, "
        f"{len(GLOBAL_MARKERS)} global capabilities, "
        f"{len(OVERVIEW_MARKERS)} overview capabilities, "
        f"{len(SEMANTIC_MARKERS)} semantic invariants, "
        f"{len(PANEL_TABS)} V2 functional inventory records and executable implementation/evidence gate present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
