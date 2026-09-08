# CSRD & Impact dashboard — canonical Portal V2 contract

## Status

Canonical module: `csrd-impact` in Portal V2.

This dashboard is part of the existing portal architecture and must not be recreated as a separate demo, standalone public page or second customer portal. The canonical registration lives in `portal-next/portal-content-map.js`; Portal V2 consumes that registry through `portal-v2/page-registry.js`.

## Position in the portal

- Primary navigation: directly after **Overzicht** as **CSRD & Impact**.
- Registry section: **Inzicht**.
- Native V2 page: no `legacyTab`.
- Related destinations:
  - sector comparison → `cijfers-maatstaven`
  - actions → `actieve-acties`
  - evidence → `outcomes-evidence`
  - audit/readiness details → `audit`
  - compliance/governance context → `compliance-governance`

## Product contract

The module combines environmental, social, governance and reporting readiness in one customer-usable cockpit:

1. total impact score and year-on-year movement;
2. CO2/climate;
3. water;
4. circularity;
5. social impact;
6. governance;
7. CSRD readiness and evidence completeness;
8. realtime operational signals when an actual runtime source exists;
9. trends against baselines and targets;
10. prioritized impact actions;
11. customer-safe presentation mode;
12. audit/evidence traceability.

## Data contract

`portal-v2/csrd-impact.js` currently exposes a deterministic fallback snapshot so UX can be tested without pretending demo data is production data. Production integrations must replace the snapshot through an adapter; they must not rewrite the UI contract.

Required domains:

- `climate`
- `water`
- `circularity`
- `social`
- `governance`

Each material metric should ultimately carry source, period, unit, baseline, target, value, validation state and evidence reference. A number without provenance must never be represented as audit-ready production evidence.

## Customer-view rule

Customer view and internal view derive from the same source model. Customer view must remove internal-only metadata such as open evidence counts, validation diagnostics, internal notes or operational details. Filtering must happen before rendering; hiding fields only with CSS is not sufficient.

Regression test: `portal-v2/tests/csrd-impact.test.mjs` asserts that the customer-safe model and customer markup do not expose internal evidence metadata.

## Interaction contract

- Domain tabs must visually focus the selected lens without discarding the full dashboard context.
- **Vergelijk met sector** reuses the existing metrics/benchmark page.
- Impact actions reuse the existing action execution layer.
- Evidence links reuse the existing outcomes/evidence and audit layers.
- Mobile layout remains usable without horizontal page overflow; tab navigation itself may scroll horizontally.

## Evidence and compliance guardrail

A green score or `Live data` label is not evidence by itself. When live provider/runtime evidence is unavailable, the consuming adapter must label values as sample, imported, calculated or unverified. Audit readiness is derived from evidence completeness and validation state, not from visual completeness.

## Definition of done

A CSRD dashboard change is complete only when:

1. the registry still resolves `csrd-impact` as a native V2 page;
2. Portal V2 tests pass;
3. customer-view leakage tests pass;
4. desktop and mobile shell remain usable;
5. links to actions, evidence, benchmark and audit still resolve to canonical portal pages;
6. production deploy points at the merged SHA;
7. live readback confirms the CSRD navigation item and dashboard load;
8. any defect found in readback becomes a regression test before closure.

## Naming

Use **CSRD** (Corporate Sustainability Reporting Directive) in product copy and code. `CRSD` is treated as a user/search alias only and must not become a second module or competing canonical name.

## Change prevention fingerprint

`portal-csrd-impact-native-v2-single-canonical-module-v1`

Prevent recurrence of: standalone sustainability demos, duplicated portal implementations, customer leakage of internal evidence metadata, unsupported live/audit claims, and navigation entries that bypass the canonical page registry.
