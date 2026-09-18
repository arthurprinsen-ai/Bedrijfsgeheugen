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
import html as html_lib
from fnmatch import fnmatchcase
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PORTAL = ROOT / "klantportaal.html"
MODULAR_LEGACY_PORTAL = ROOT / "portal"
V2_STRATEGIC_MODELS = ROOT / "portal-v2" / "strategic-models-core.js"
V2_LEGACY_ENGINE = ROOT / "portal-v2" / "legacy-parity-engine.js"
V2_LEGACY_FINANCE = ROOT / "portal-v2" / "legacy-finance-models.js"
V2_OVERVIEW_COMPLETE = ROOT / "portal-v2" / "modules" / "legacy-overview-complete.js"
V2_AI_CAPABILITY_CATALOG = ROOT / "portal-v2" / "ai-capability-catalog.js"
V2_FUNCTIONAL_INVENTORY = ROOT / "portal-v2" / "legacy-functional-inventory.js"
V2_PARITY_GATE = ROOT / "portal-v2" / "parity-gate.js"
V2_PARITY_TEST = ROOT / "portal-v2" / "tests" / "parity-gate.test.mjs"

PANEL_TABS = {
    "overzicht", "profiel", "dataai", "aiscan", "invoeren", "antwoorden",
    "business", "cijfers", "waarde", "mensen", "branche", "onderzoek",
    "beleid", "aicap", "strategie", "canvassen", "eindconclusie", "dd",
    "dna", "bijhouden", "wijzigingen", "advies", "offerte", "roadmap", "uitvoering",
}

NAVIGATION_KEYS = PANEL_TABS - {"uitvoering"}

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

V2_OVERVIEW_MARKERS = {
    "company state": "De staat van je bedrijf",
    "cmmi ladder": "Procesvolwassenheid (CMMI)",
    "adoption curve": "Waar je staat op de adoptiecurve",
    "time leakage": "Waar de tijd weglekt",
    "cost-ranked blockers": "Wat je nu remt",
    "first action": "Eerst dit:",
    "sharpness": "Hoe scherp is je beeld",
    "business completeness": "Je bedrijfsgegevens",
    "thirteen dimensions": "De dertien onderdelen",
    "86 capabilities": "De 86 AI-capabilities",
    "roadmap actions": "Acties in je roadmap",
    "next step": "Zet hierna deze stap:",
    "progress": "Je voortgang",
    "next advice": "En dan?",
}

LEGACY_MODEL_MAP = {
    "Model Theory of Constraints": ("strategy", "toc", V2_STRATEGIC_MODELS),
    "Model 7S": ("strategy", "seven-s", V2_STRATEGIC_MODELS),
    "Model waardeketen": ("strategy", "value-chain", V2_STRATEGIC_MODELS),
    "Model vijf krachten": ("strategy", "five-forces", V2_STRATEGIC_MODELS),
    "Model BCG": ("strategy", "bcg", V2_STRATEGIC_MODELS),
    "Model Ansoff": ("strategy", "ansoff", V2_STRATEGIC_MODELS),
    "Model DESTEP": ("strategy", "destep", V2_STRATEGIC_MODELS),
    "Model ADKAR": ("strategy", "adkar", V2_STRATEGIC_MODELS),
    "Model SWOT": ("strategy", "swot", V2_STRATEGIC_MODELS),
    "Model Balanced Scorecard": ("strategy", "balanced-scorecard", V2_STRATEGIC_MODELS),
    "Model Blue Ocean": ("strategy", "blue-ocean", V2_STRATEGIC_MODELS),
    "Model drie horizonten": ("strategy", "three-horizons", V2_STRATEGIC_MODELS),
    "Model Ulrich": ("strategy", "ulrich", V2_STRATEGIC_MODELS),
    "Model SIPOC": ("strategy", "sipoc", V2_STRATEGIC_MODELS),
    "Model RACI": ("strategy", "raci", V2_STRATEGIC_MODELS),
    "Model OCAI": ("strategy", "ocai", V2_STRATEGIC_MODELS),
    "Model salestrechter": ("strategy", "sales-funnel", V2_STRATEGIC_MODELS),
    "Model AARRR": ("strategy", "aarrr", V2_STRATEGIC_MODELS),
    "Model Kraljic": ("strategy", "kraljic", V2_STRATEGIC_MODELS),
    "Model Pareto": ("strategy", "pareto-receivables", V2_STRATEGIC_MODELS),
    "Model EBITDA-multiple": ("finance", "ebitda-multiple", V2_LEGACY_ENGINE),
    "Model EBITDA-marge": ("finance", "ebitda-margin", V2_LEGACY_ENGINE),
    "Model solvabiliteit": ("finance", "solvency", V2_LEGACY_FINANCE),
    "Model DSCR": ("finance", "dscr", V2_LEGACY_ENGINE),
    "Model DuPont": ("finance", "dupont", V2_LEGACY_ENGINE),
    "Model Altman Z": ("finance", "altman-z", V2_LEGACY_ENGINE),
    "Model break-even": ("finance", "break-even", V2_LEGACY_ENGINE),
    "Model werkkapitaal": ("finance", "working-capital-days", V2_LEGACY_FINANCE),
}
MODEL_ENTRY = re.compile(r"\{k:'(?P<key>Model [^']+)',n:'(?P<name>[^']+)',soort:'(?P<kind>model|finance|functie)'\}")
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


def extract_legacy_model_catalog(html: str) -> list[dict[str, str]]:
    found = []
    seen = set()
    for match in MODEL_ENTRY.finditer(html):
        key = match.group("key")
        if key in seen:
            continue
        seen.add(key)
        found.append({"key": key, "name": match.group("name"), "kind": match.group("kind")})
    return found


def check_source_derived_model_parity(html: str) -> tuple[int, int]:
    catalog = extract_legacy_model_catalog(html)
    source_keys = {item["key"] for item in catalog}
    missing = []
    for item in catalog:
        mapping = LEGACY_MODEL_MAP.get(item["key"])
        if mapping is None:
            missing.append(f"unmapped:{item['key']}")
            continue
        expected_kind = "finance" if item["kind"] == "finance" else "strategy"
        kind, target, path = mapping
        if kind != expected_kind:
            missing.append(f"wrong-kind:{item['key']}")
            continue
        if not path.exists() or not re.search(rf"(?<![A-Za-z0-9_-]){re.escape(target)}(?![A-Za-z0-9_-])", path.read_text(encoding="utf-8")):
            missing.append(f"missing-target:{item['key']}->{target}")
    for key in sorted(set(LEGACY_MODEL_MAP) - source_keys):
        missing.append(f"stale-mapping:{key}")
    strategy_count = sum(item["kind"] in {"model", "functie"} for item in catalog)
    finance_count = sum(item["kind"] == "finance" for item in catalog)
    if missing or strategy_count != 20 or finance_count != 8 or len(catalog) != 28:
        fail(f"source-derived legacy model parity failed: strategy={strategy_count}, finance={finance_count}, missing={missing}")
    return strategy_count, finance_count


def check_source_derived_heading_parity(html: str) -> int:
    """Every visible legacy panel heading must remain discoverable in native V2 source."""
    v2_sources = []
    for path in (ROOT / "portal-v2").rglob("*"):
        if path.is_file() and path.suffix in {".js", ".mjs", ".html", ".md"} and "tests" not in path.parts:
            try:
                v2_sources.append(path.read_text(encoding="utf-8"))
            except UnicodeDecodeError:
                continue
    haystack = html_lib.unescape("\n".join(v2_sources))
    protected = 0
    missing = []
    for panel in sorted(PANEL_TABS):
        match = re.search(
            rf'<section class="paneel(?: aan)?" id="p-{re.escape(panel)}">(.*?)(?=<section class="paneel|</div></div>\s*</div>\s*<nav|$)',
            html,
            re.DOTALL,
        )
        if not match:
            continue
        body = match.group(1)
        headings = []
        for raw in re.findall(r"<h[23][^>]*>(.*?)</h[23]>", body, re.DOTALL):
            plain = html_lib.unescape(re.sub(r"<[^>]+>", " ", raw))
            plain = re.sub(r"\s+", " ", plain).strip()
            if plain:
                headings.append(plain)
        for heading in headings:
            protected += 1
            if heading not in haystack:
                missing.append(f"{panel}:{heading}")
    if missing:
        fail(
            "legacy visible headings disappeared from native V2: "
            + " | ".join(missing)
            + ". Restore the user-facing surface; route-only or model-only parity is insufficient."
        )
    return protected


def check_ai_capability_catalog_parity(html: str) -> int:
    if not V2_AI_CAPABILITY_CATALOG.exists():
        fail("missing native Portal V2 AI capability catalogue")
    source_ids = set(re.findall(r'"id":"([a-z0-9-]+)"', html))
    source_ids = {
        item for item in source_ids
        if re.match(r'^(strategie|kanalen|agenten|controlplane|modellen|kennis|infra|governance|identiteit)-\d{2}
    }
    v2_source = V2_AI_CAPABILITY_CATALOG.read_text(encoding="utf-8")
    v2_ids = set(re.findall(r'"id":\s*"([a-z0-9-]+)"', v2_source))
    if len(source_ids) != 86 or source_ids != v2_ids:
        missing = sorted(source_ids - v2_ids)
        extra = sorted(v2_ids - source_ids)
        fail(
            f"AI capability catalogue drift: legacy={len(source_ids)}, "
            f"v2={len(v2_ids)}, missing={missing}, extra={extra}"
        )
    return len(v2_ids)


def check_v2_overview_surface() -> None:
    if not V2_OVERVIEW_COMPLETE.exists():
        fail("missing complete Portal V2 legacy overview renderer")
    source = V2_OVERVIEW_COMPLETE.read_text(encoding="utf-8")
    for label, marker in V2_OVERVIEW_MARKERS.items():
        if marker not in source:
            fail(f"Portal V2 overview lost legacy surface: {label} ({marker!r})")
    for marker in ("*.15", "*.25", "*.30", "dimension-costs", "businesscase", "ai-capabilities"):
        if marker not in source:
            fail(f"Portal V2 overview lost protected semantic implementation marker: {marker}")


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
    for marker in ("all protected legacy capabilities", "fails closed", "all 25 capabilities verified"):
        if marker not in test_source:
            fail(f"V2 implementation parity test lost protected assertion: {marker}")


def main() -> int:
    if not PORTAL.exists():
        fail(f"missing protected portal file: {PORTAL.relative_to(ROOT)}")
    if not V2_FUNCTIONAL_INVENTORY.exists():
        fail(f"missing V2 functional inventory: {V2_FUNCTIONAL_INVENTORY.relative_to(ROOT)}")
    if not MODULAR_LEGACY_PORTAL.is_dir():
        fail("missing modular legacy portal source: portal/")

    html = PORTAL.read_text(encoding="utf-8")
    inventory_source = V2_FUNCTIONAL_INVENTORY.read_text(encoding="utf-8")

    tabs = set(re.findall(r'data-p="([^"]+)"', html))
    missing_tabs = sorted(NAVIGATION_KEYS - tabs)
    if missing_tabs:
        fail(f"protected navigation keys disappeared: {', '.join(missing_tabs)}")

    panel_ids = set(re.findall(r'id="p-([^"]+)"', html))
    missing_panels = sorted(PANEL_TABS - panel_ids)
    if missing_panels:
        fail(f"protected panels disappeared: {', '.join(missing_panels)}")

    for label, marker in {**GLOBAL_MARKERS, **OVERVIEW_MARKERS, **SEMANTIC_MARKERS}.items():
        if marker not in html:
            fail(f"protected capability/meaning disappeared: {label} ({marker!r})")

    strategy_models, finance_models = check_source_derived_model_parity(html)
    protected_headings = check_source_derived_heading_parity(html)
    ai_capabilities = check_ai_capability_catalog_parity(html)
    check_v2_overview_surface()
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
        f"{strategy_models} strategy/function models, "
        f"{finance_models} finance models, "
        f"{ai_capabilities} AI capabilities, "
        f"{protected_headings} visible legacy headings, "
        f"{len(PANEL_TABS)} V2 functional inventory records and executable implementation/evidence gate present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
, item)
    }
    v2_source = V2_AI_CAPABILITY_CATALOG.read_text(encoding="utf-8")
    v2_ids = set(re.findall(r'"id":\\s*"([a-z0-9-]+)"', v2_source))
    if len(source_ids) != 86 or source_ids != v2_ids:
        missing = sorted(source_ids - v2_ids)
        extra = sorted(v2_ids - source_ids)
        fail(
            f"AI capability catalogue drift: legacy={len(source_ids)}, "
            f"v2={len(v2_ids)}, missing={missing}, extra={extra}"
        )
    return len(v2_ids)


def check_v2_overview_surface() -> None:
    if not V2_OVERVIEW_COMPLETE.exists():
        fail("missing complete Portal V2 legacy overview renderer")
    source = V2_OVERVIEW_COMPLETE.read_text(encoding="utf-8")
    for label, marker in V2_OVERVIEW_MARKERS.items():
        if marker not in source:
            fail(f"Portal V2 overview lost legacy surface: {label} ({marker!r})")
    for marker in ("*.15", "*.25", "*.30", "dimension-costs", "businesscase", "ai-capabilities"):
        if marker not in source:
            fail(f"Portal V2 overview lost protected semantic implementation marker: {marker}")


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
    for marker in ("all protected legacy capabilities", "fails closed", "all 25 capabilities verified"):
        if marker not in test_source:
            fail(f"V2 implementation parity test lost protected assertion: {marker}")


def main() -> int:
    if not PORTAL.exists():
        fail(f"missing protected portal file: {PORTAL.relative_to(ROOT)}")
    if not V2_FUNCTIONAL_INVENTORY.exists():
        fail(f"missing V2 functional inventory: {V2_FUNCTIONAL_INVENTORY.relative_to(ROOT)}")
    if not MODULAR_LEGACY_PORTAL.is_dir():
        fail("missing modular legacy portal source: portal/")

    html = PORTAL.read_text(encoding="utf-8")
    inventory_source = V2_FUNCTIONAL_INVENTORY.read_text(encoding="utf-8")

    tabs = set(re.findall(r'data-p="([^"]+)"', html))
    missing_tabs = sorted(NAVIGATION_KEYS - tabs)
    if missing_tabs:
        fail(f"protected navigation keys disappeared: {', '.join(missing_tabs)}")

    panel_ids = set(re.findall(r'id="p-([^"]+)"', html))
    missing_panels = sorted(PANEL_TABS - panel_ids)
    if missing_panels:
        fail(f"protected panels disappeared: {', '.join(missing_panels)}")

    for label, marker in {**GLOBAL_MARKERS, **OVERVIEW_MARKERS, **SEMANTIC_MARKERS}.items():
        if marker not in html:
            fail(f"protected capability/meaning disappeared: {label} ({marker!r})")

    strategy_models, finance_models = check_source_derived_model_parity(html)
    protected_headings = check_source_derived_heading_parity(html)
    ai_capabilities = check_ai_capability_catalog_parity(html)
    check_v2_overview_surface()
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
        f"{strategy_models} strategy/function models, "
        f"{finance_models} finance models, "
        f"{ai_capabilities} AI capabilities, "
        f"{protected_headings} visible legacy headings, "
        f"{len(PANEL_TABS)} V2 functional inventory records and executable implementation/evidence gate present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
, item)
    }
    v2_source = V2_AI_CAPABILITY_CATALOG.read_text(encoding="utf-8")
    v2_ids = set(re.findall(r'"id":\s*"([a-z0-9-]+)"', v2_source))
    if len(source_ids) != 86 or source_ids != v2_ids:
        missing = sorted(source_ids - v2_ids)
        extra = sorted(v2_ids - source_ids)
        fail(
            f"AI capability catalogue drift: legacy={len(source_ids)}, "
            f"v2={len(v2_ids)}, missing={missing}, extra={extra}"
        )
    return len(v2_ids)


def check_v2_overview_surface() -> None:
    if not V2_OVERVIEW_COMPLETE.exists():
        fail("missing complete Portal V2 legacy overview renderer")
    source = V2_OVERVIEW_COMPLETE.read_text(encoding="utf-8")
    for label, marker in V2_OVERVIEW_MARKERS.items():
        if marker not in source:
            fail(f"Portal V2 overview lost legacy surface: {label} ({marker!r})")
    for marker in ("*.15", "*.25", "*.30", "dimension-costs", "businesscase", "ai-capabilities"):
        if marker not in source:
            fail(f"Portal V2 overview lost protected semantic implementation marker: {marker}")


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
    for marker in ("all protected legacy capabilities", "fails closed", "all 25 capabilities verified"):
        if marker not in test_source:
            fail(f"V2 implementation parity test lost protected assertion: {marker}")


def main() -> int:
    if not PORTAL.exists():
        fail(f"missing protected portal file: {PORTAL.relative_to(ROOT)}")
    if not V2_FUNCTIONAL_INVENTORY.exists():
        fail(f"missing V2 functional inventory: {V2_FUNCTIONAL_INVENTORY.relative_to(ROOT)}")
    if not MODULAR_LEGACY_PORTAL.is_dir():
        fail("missing modular legacy portal source: portal/")

    html = PORTAL.read_text(encoding="utf-8")
    inventory_source = V2_FUNCTIONAL_INVENTORY.read_text(encoding="utf-8")

    tabs = set(re.findall(r'data-p="([^"]+)"', html))
    missing_tabs = sorted(NAVIGATION_KEYS - tabs)
    if missing_tabs:
        fail(f"protected navigation keys disappeared: {', '.join(missing_tabs)}")

    panel_ids = set(re.findall(r'id="p-([^"]+)"', html))
    missing_panels = sorted(PANEL_TABS - panel_ids)
    if missing_panels:
        fail(f"protected panels disappeared: {', '.join(missing_panels)}")

    for label, marker in {**GLOBAL_MARKERS, **OVERVIEW_MARKERS, **SEMANTIC_MARKERS}.items():
        if marker not in html:
            fail(f"protected capability/meaning disappeared: {label} ({marker!r})")

    strategy_models, finance_models = check_source_derived_model_parity(html)
    protected_headings = check_source_derived_heading_parity(html)
    ai_capabilities = check_ai_capability_catalog_parity(html)
    check_v2_overview_surface()
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
        f"{strategy_models} strategy/function models, "
        f"{finance_models} finance models, "
        f"{ai_capabilities} AI capabilities, "
        f"{protected_headings} visible legacy headings, "
        f"{len(PANEL_TABS)} V2 functional inventory records and executable implementation/evidence gate present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
, item)
    }
    v2_source = V2_AI_CAPABILITY_CATALOG.read_text(encoding="utf-8")
    v2_ids = set(re.findall(r'"id":\\s*"([a-z0-9-]+)"', v2_source))
    if len(source_ids) != 86 or source_ids != v2_ids:
        missing = sorted(source_ids - v2_ids)
        extra = sorted(v2_ids - source_ids)
        fail(
            f"AI capability catalogue drift: legacy={len(source_ids)}, "
            f"v2={len(v2_ids)}, missing={missing}, extra={extra}"
        )
    return len(v2_ids)


def check_v2_overview_surface() -> None:
    if not V2_OVERVIEW_COMPLETE.exists():
        fail("missing complete Portal V2 legacy overview renderer")
    source = V2_OVERVIEW_COMPLETE.read_text(encoding="utf-8")
    for label, marker in V2_OVERVIEW_MARKERS.items():
        if marker not in source:
            fail(f"Portal V2 overview lost legacy surface: {label} ({marker!r})")
    for marker in ("*.15", "*.25", "*.30", "dimension-costs", "businesscase", "ai-capabilities"):
        if marker not in source:
            fail(f"Portal V2 overview lost protected semantic implementation marker: {marker}")


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
    for marker in ("all protected legacy capabilities", "fails closed", "all 25 capabilities verified"):
        if marker not in test_source:
            fail(f"V2 implementation parity test lost protected assertion: {marker}")


def main() -> int:
    if not PORTAL.exists():
        fail(f"missing protected portal file: {PORTAL.relative_to(ROOT)}")
    if not V2_FUNCTIONAL_INVENTORY.exists():
        fail(f"missing V2 functional inventory: {V2_FUNCTIONAL_INVENTORY.relative_to(ROOT)}")
    if not MODULAR_LEGACY_PORTAL.is_dir():
        fail("missing modular legacy portal source: portal/")

    html = PORTAL.read_text(encoding="utf-8")
    inventory_source = V2_FUNCTIONAL_INVENTORY.read_text(encoding="utf-8")

    tabs = set(re.findall(r'data-p="([^"]+)"', html))
    missing_tabs = sorted(NAVIGATION_KEYS - tabs)
    if missing_tabs:
        fail(f"protected navigation keys disappeared: {', '.join(missing_tabs)}")

    panel_ids = set(re.findall(r'id="p-([^"]+)"', html))
    missing_panels = sorted(PANEL_TABS - panel_ids)
    if missing_panels:
        fail(f"protected panels disappeared: {', '.join(missing_panels)}")

    for label, marker in {**GLOBAL_MARKERS, **OVERVIEW_MARKERS, **SEMANTIC_MARKERS}.items():
        if marker not in html:
            fail(f"protected capability/meaning disappeared: {label} ({marker!r})")

    strategy_models, finance_models = check_source_derived_model_parity(html)
    protected_headings = check_source_derived_heading_parity(html)
    ai_capabilities = check_ai_capability_catalog_parity(html)
    check_v2_overview_surface()
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
        f"{strategy_models} strategy/function models, "
        f"{finance_models} finance models, "
        f"{ai_capabilities} AI capabilities, "
        f"{protected_headings} visible legacy headings, "
        f"{len(PANEL_TABS)} V2 functional inventory records and executable implementation/evidence gate present."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
