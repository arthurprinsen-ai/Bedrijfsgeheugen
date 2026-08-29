# Portal Function Parity Ledger

Status: **BASELINE LOCKED — migration retirement prohibited until row-level verification**
Baseline source: `klantportaal.html` on `main` at 2026-08-29.

## Rule
No existing customer-visible capability may disappear, change meaning, lose historical data, lose a status/action, become desktop-only, or become less permissive/restrictive by accident. `DELETE` requires explicit approved duplicate proof. Until then the default is `KEEP` or `IMPROVE`.

## Current shell and global actions

| Existing capability | Baseline evidence | Target | Classification | Retirement gate |
|---|---|---|---|---|
| Netlify Identity login/logout | identity widget + logout action | governed identity shell | KEEP/IMPROVE | auth parity + session tests |
| Site navigation | Frisse blik, Zelfscan, Expertises, Contact | global shell | KEEP | route smoke green |
| Download/export | `btnExport`, `mExport` | Beheer/export | KEEP | content + permission parity |
| Open/import JSON | `btnImport`, `mImport` | Beheer/import | KEEP | round-trip parity |
| Print/PDF | print actions via `vraagToegang` | Beheer/reporting | KEEP | permission + print parity |
| Feedback | `fbKnop`/feedback layer | global feedback | KEEP/IMPROVE | submission parity |
| Customer branding | `klantMerk` | organization shell | KEEP | tenant branding parity |
| Tooltips/context | `data-tip` | contextual help | IMPROVE | keyboard/touch equivalent |
| Mobile navigation | responsive menu/bottom navigation | Home/Werk/AI/Changes/Meer | IMPROVE | mobile functional parity |

## Current portal tabs/panels

| Current tab (`data-p`) | Current meaning | New destination | Classification | Required parity |
|---|---|---|---|---|
| `overzicht` | maturity, annual manual-work capacity cost, FTE, company state, CMMI, adoption, leakage, blockers, progress, advice | Overzicht | IMPROVE | all current metrics/calculations + new management summary |
| `profiel` | profile per business component | Business Health / domains | IMPROVE | all profile dimensions/history |
| `dataai` | data & AI maturity, phases, change, governance, economics, CMMI/Greiner/policy | Data & Technologie | IMPROVE | all models/benchmarks/source references |
| `aiscan` | AI scan opportunity map | Data & Technologie / AI | KEEP/IMPROVE | rows, inputs, scoring, opportunities |
| `invoeren` | customer/company data input | contextual object editors | IMPROVE | every input field and validation |
| `antwoorden` | submitted answers | Frisse Blik / Evidence | KEEP | immutable original answers |
| `business` | business case | Groei/Finance/Impact | IMPROVE | calculations + assumptions + output |
| `cijfers` | metrics and benchmarks | KPI/Metric workspaces | IMPROVE | definitions, values, benchmark meaning |
| `waarde` | value and financing | Finance/Impact | IMPROVE | calculations and scenario meaning |
| `mensen` | people/org analysis | Organisatie | IMPROVE | current fields/outputs; sensitive policy added |
| `branche` | industry and market | Groei / External Intelligence | IMPROVE | current benchmarks/signals |
| `onderzoek` | research/evidence | Evidence / External Intelligence | KEEP/IMPROVE | sources and traceability |
| `beleid` | compliance, security, governance | Trust & Governance | IMPROVE | current controls/content + new governance graph |
| `aicap` | AI capabilities | Data & Technologie / AI | KEEP/IMPROVE | capability data/statuses |
| `strategie` | strategy models | Strategie | KEEP/IMPROVE | all existing models/fields/statuses |
| `canvassen` | canvases | Model Library + contextual | KEEP/IMPROVE | every canvas/field/status/history |
| `eindconclusie` | final conclusion | Overzicht / Management Summary | IMPROVE | source conclusions + evidence |
| `dd` | due diligence & exit | Trust/Growth/Reports context | KEEP/IMPROVE | all DD/exit outputs |
| `dna` | strategy to execution | Strategie + Uitvoering | IMPROVE | Strategy DNA/execution mapping |
| `bijhouden` | keep-current/freshness | platform-wide freshness | IMPROVE | refresh/freshness behavior |
| `wijzigingen` | changes | Uitvoering / Change Center | IMPROVE | current change history + new lifecycle |
| `advies` | advice | contextual Recommendations | IMPROVE | recommendations, ordering, actions |
| `offerte` | proposal/configuration | Groei/Beheer | KEEP | selectable items, totals, detail, status |
| `roadmap` | roadmap | Uitvoering / Roadmap | IMPROVE | all items, statuses, dates, ordering, progress |

## Known overview calculations/visuals that are protected

- Volwassenheid and textual maturity interpretation.
- Handwerk per jaar: hours × hourly cost × 46 weeks; semantics explicitly describe released capacity, not automatically realized cash savings.
- Bezetting/FTE and explanatory text.
- Company-state five-stage visualization.
- CMMI process maturity.
- Adoption curve.
- Time/cost leakage visualization.
- Current blockers.
- Roadmap progress.
- Advice ordering/next action.

These meanings must not be silently changed by the new Business Health/Management Summary model.

## Cross-cutting parity dimensions

Every row must be verified across:

1. records/counts;
2. fields and validation;
3. lifecycle/status semantics;
4. actions and side effects;
5. calculations and units;
6. permissions;
7. route/deep-link behavior;
8. relationships/dependencies;
9. history/provenance;
10. desktop;
11. mobile/touch;
12. export/import/print where applicable;
13. stale/error/empty states;
14. accessibility of essential actions.

## Migration states

Allowed ledger states:

- `BASELINE_CAPTURED`
- `MAPPED`
- `DUAL_RUN`
- `RECONCILED`
- `PARITY_VERIFIED`
- `RETIREMENT_APPROVED`
- `RETIRED`

No row may jump from `MAPPED` to `RETIRED`.

## Current program state

All rows: `BASELINE_CAPTURED`.

Next gate: automated static baseline test must prove that every current `data-p` navigation key still has a corresponding `p-*` panel (except explicit non-panel beheer actions), global protected actions remain present, and core overview semantics remain detectable. Runtime/browser parity is additive to this static gate, not replaced by it.
