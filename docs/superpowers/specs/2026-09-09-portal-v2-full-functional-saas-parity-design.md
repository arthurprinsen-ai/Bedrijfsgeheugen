# Portal V2 — Full Functional SaaS Parity Design

Date: 2026-09-09
Status: approved in principle by user; written spec pending explicit review
Base: `main` at `db6d1adb292b73621d0ee9b5e3beede1f2cad323`

## 1. Goal

Portal V2 must become the only customer-facing portal experience while preserving the complete functional capability of the protected legacy portal. The old portal remains a reference baseline during migration, never a runtime dependency of V2.

The migration is not a visual port. It is a full functional rebuild: every legacy question, field, model, canvas, calculation, score, action, workflow, output and cross-link must be available natively in Portal V2, with better SaaS UX on desktop and mobile.

## 2. Non-negotiable invariants

1. No iframe, redirect, hidden route, fallback, runtime import or user journey back to `/klantportaal`, `portal-next`, or another legacy shell.
2. Legacy content and calculation semantics are the functional source of truth until a capability is proven migrated.
3. The current V2 generic `metrics/worklist/actions` presentation is not considered functional parity for a capability that was editable or interactive in the old portal.
4. A capability is complete only when its data can be entered or edited, persisted, reopened, validated, used in dependent calculations and exercised in a browser test.
5. Mobile and desktop use the same canonical state and capability model; only composition differs.
6. Existing proven V2 modules such as Strategy DNA and the connector builder are reused rather than rewritten.
7. Production claims require exact-SHA CI, deployment and production readback evidence.

## 3. Protected legacy scope

The legacy parity baseline contains these 24 capability areas and all must be functionally represented in V2:

| Legacy key | V2 destination | Required functional outcome |
| --- | --- | --- |
| `overzicht` | `overzicht` | live customer-derived summary, maturity, manual work, FTE, company state, CMMI/adoption/leakage/blockers/progress/advice |
| `profiel` | `profiel` | editable company/profile sections and derived completeness |
| `dataai` | `data-ai` | source/data/AI assessment, editable state and linked connector actions |
| `aiscan` | `ai-scan` | editable AI opportunity scan, prioritisation and result derivation |
| `invoeren` | `gegevens-invullen` | complete structured input journey for all legacy questions |
| `antwoorden` | `ingevulde-gegevens` | review/edit all answers with source, owner and freshness |
| `business` | `businesscase` | editable assumptions, investment, benefit, capacity, risk and calculated scenarios |
| `cijfers` | `cijfers-maatstaven` | editable KPI/benchmark values and comparisons |
| `waarde` | `waarde-financiering` | editable valuation/financing assumptions and scenario output |
| `mensen` | `mensen` | roles, capacity, dependency and knowledge-risk input |
| `branche` | `branche-markt` | market/competitor/benchmark input and comparison |
| `onderzoek` | `onderzoek` | hypotheses, sources, findings, evidence and conclusions |
| `beleid` | `compliance-governance` | obligations, controls, owners, evidence, risks, policy state and actions |
| `aicap` | `ai-capabilities` | capability assessment, status, risk, governance and evidence |
| `strategie` | `strategie-naar-maandagochtend` + `strategiemodellen` | strategy input plus translation to execution |
| `canvassen` | `canvassen` | all legacy canvases as editable native V2 canvases |
| `eindconclusie` | `eindconclusie` | editable/derived final conclusion with traceability to evidence |
| `dd` | `due-diligence` | complete due-diligence dossier with findings, evidence and materiality |
| `dna` | `strategy-dna` | retain existing native functional Strategy DNA and close any legacy gaps |
| `bijhouden` | `actueel-houden` | owners, review dates, freshness and update workflow |
| `wijzigingen` | `wijzigingen` | material changes, affected domains, impact and follow-up |
| `advies` | `advies` | editable/generated advice, acceptance and conversion into action |
| `offerte` | `offerte` | scope, assumptions, approach, pricing/offer state and output |
| `roadmap` | `roadmap` | initiatives, dependencies, milestones, owners, progress and outcomes |

Protected global capabilities must remain native in V2: authenticated customer context, logout, export, import, permission-gated print, feedback, customer branding and mobile navigation.

Protected overview semantics must remain intact, including the distinction between capacity gained and cash released and the 46-week annualisation basis.

## 4. Product architecture

### 4.1 Canonical domain state

Introduce a single V2 domain-state layer for editable portal data. It is responsible for:

- reading the authenticated tenant/customer state;
- exposing typed capability slices;
- autosave and explicit save states;
- validation and schema versioning;
- optimistic UI with server confirmation;
- staged import and conflict handling;
- derived calculations and dependency invalidation;
- audit metadata: source, owner, changed by, changed at, evidence reference.

The domain-state API must sit above the existing safe server storage contract and must not let the browser select arbitrary tenants.

### 4.2 Capability registry

Replace the presentational-only interpretation of `page-registry.js` with a functional capability contract. Every registered work page declares at least:

- `id`
- `legacyCapability`
- `mode`: `workspace`, `canvas`, `form`, `cockpit`, `report`, or `builder`
- `schemaVersion`
- `renderer`
- `dataSlice`
- `validators`
- `calculators`
- `dependencies`
- `completionRules`
- `browserContract`

A generic display-only renderer is allowed only for read-only pages. It cannot satisfy parity for any legacy editable capability.

### 4.3 Workspaces

Each functional page becomes a true workspace rather than a popup containing static cards.

Desktop composition:
- persistent left navigation;
- page header with completion/status and primary action;
- workspace tabs where needed: `Invullen`, `Analyse`, `Acties`, `Bewijs`;
- split-view or dense grids for canvases/models;
- sticky save/state indicator;
- contextual side panel for evidence/help/history when useful.

Mobile composition:
- card-first workflow;
- one logical section at a time;
- bottom primary action/save progression;
- collapsible summary and progress;
- no horizontal page scrolling;
- inputs sized for touch and keyboard-safe layouts;
- canvas/model sections transformed into stacked editable blocks rather than shrunk desktop canvases.

## 5. Interaction model

All editable modules use the same interaction primitives:

- text, number, percentage, currency and date fields;
- select, multiselect and ranked choice;
- range/scale with explicit numeric value;
- yes/no/unknown tri-state;
- owners and review dates;
- evidence/document references;
- repeatable rows;
- assumptions with provenance;
- inline calculated fields;
- status and completion chips;
- action conversion (`maak taak`, `zet op roadmap`, `maak advies`).

Autosave must visibly communicate `Opslaan…`, `Opgeslagen`, or a recoverable error. Failed writes never silently appear successful.

## 6. Models and canvases

The old portal's models and canvases are migrated as real editable components, not screenshots or static summaries.

Minimum model families to inventory and map from legacy source before implementation closes:
- SWOT;
- OGSM / goal-to-measure strategy structure;
- Porter / market models where present;
- Business Model / value proposition canvases where present;
- execution/strategy canvases;
- AI canvas/capability assessments;
- businesscase and value models;
- risk/compliance models;
- due-diligence structures.

Each model must support editing, persistence, reopen, completion state, evidence linkage and output into dependent modules. The implementation plan must derive the exact model inventory from `klantportaal.html` and related legacy JS before coding each cluster; no model may disappear because it was omitted from this summary list.

## 7. Calculations and dependencies

Calculations move out of view code into deterministic pure calculator modules with tests. Examples include:

- completeness scores;
- maturity;
- annual manual-work capacity using the protected annualisation rule;
- FTE conversion;
- businesscase investment/batenscenario/payback;
- prioritisation scores;
- benchmark deltas;
- valuation/scenario outputs;
- compliance readiness;
- final-conclusion rollups.

Every derived number shown in V2 must trace to persisted source values or runtime evidence; placeholder demo values are prohibited once that capability is marked migrated.

## 8. Existing modules to preserve and integrate

The following already-functional V2 modules remain first-class and must be connected to the shared state model rather than replaced:

- Strategy DNA;
- CSRD/Impact cockpit where functionally complete;
- existing connector builder mounted at `koppelingen`;
- authenticated customer state, branding, import/export, print, feedback and logout flows already introduced in V2.

The connector builder remains the canonical builder for creating, testing, activating and managing connections.

## 9. Migration sequence

Migration is incremental but fail-closed. Recommended release clusters:

1. **Foundation** — capability contracts, canonical domain state, form primitives, autosave, validation, progress and calculation harness.
2. **Company input** — profiel, gegevens invullen, ingevulde gegevens, overzicht derived from real state.
3. **Strategy/models/canvases** — strategy, all models, all canvases, Strategy DNA integration and final conclusion.
4. **Commercial/financial** — businesscase, figures/benchmarks, value/financing, market/research.
5. **People/operations** — people, knowledge dependencies, current-state tracking and changes.
6. **Compliance/AI** — policy/compliance, command center, AI capabilities and AI scan.
7. **M&A** — due diligence and exit readiness.
8. **Execution** — advice, quote, roadmap, tasks/workflows and action conversion.
9. **Global parity closure** — import/export/print/feedback/branding/auth regression coverage plus full legacy-to-V2 matrix.

A cluster can ship independently only when it replaces its static placeholder with a functional module and passes its browser/runtime contracts.

## 10. Testing strategy

### 10.1 Static parity gate

Add a V2 parity manifest that maps every protected legacy capability and global marker to its native V2 implementation. CI fails if a required capability has no renderer, schema, persistence contract or test reference.

### 10.2 Unit tests

For each migrated module:
- schema validation;
- default/empty state;
- calculations;
- completion rules;
- migrations between schema versions;
- dependency recalculation;
- invalid and partial inputs.

### 10.3 Integration/browser tests

For every editable capability, browser coverage must prove:
1. open page from canonical navigation;
2. edit representative values;
3. save/autosave succeeds;
4. reopen page and verify persistence;
5. dependent calculated output changes correctly;
6. convert to a linked action where applicable;
7. mobile 320/390/430 px has no horizontal overflow and all core controls remain usable.

### 10.4 Production readback

Each release requires:
- Required `test` green on exact candidate SHA;
- Portal V2 targeted tests green;
- exact Netlify production `commit_ref` after merge;
- production DOM/runtime readback;
- browser smoke for the capability shipped in that release.

## 11. Definition of done

Full functional SaaS parity is complete only when:

- all 24 protected legacy capability areas have a native functional V2 implementation;
- all legacy models and canvases discovered in source inventory are editable in V2;
- all legacy questions/fields that drive portal output are available or intentionally superseded with an explicitly equivalent field mapping;
- derived numbers come from persisted customer state, not static demo constants;
- imports/exports, print, feedback, branding, auth/logout and mobile navigation work natively;
- every migrated capability has persistence + reopen browser proof;
- the parity manifest reports zero open obligations;
- the legacy portal is no longer required by any V2 runtime path;
- exact production deployment and readback are green.

Only then may the old portal be retired as a functional reference.

## 12. Explicitly out of scope

- pixel-for-pixel reproduction of the old UI;
- preserving poor legacy interaction patterns merely for visual similarity;
- iframe embedding or hidden fallbacks;
- inventing new unrelated modules before parity is closed;
- replacing already-proven builders or backend contracts without evidence they block parity.

## 13. UX quality bar

The resulting product should feel like one modern B2B SaaS application rather than a collection of reports. Users must be able to understand where they are, what is complete, what remains, what changed because of their input, and what action to take next. Every page that implies work must allow actual work.
