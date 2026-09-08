# Portal V2 Native Parity Design

## Goal

Make `portal-v2` the single, native customer portal for Bedrijfsgeheugen with functional parity to the protected legacy `klantportaal.html`, while preserving the current Portal V2 SaaS design, Brain/Powerhouse model, mobile-first UX and standalone architecture.

The legacy portal remains a reference baseline during migration only. Portal V2 must not depend at runtime on `/klantportaal`, `portal-next`, legacy iframes, legacy redirects, or a second portal shell.

## Why this is required

Portal V2 currently exposes a large page registry, but route presence is not equivalent to functional parity. The legacy portal has protected capabilities and interaction flows that are not yet proven 1:1 in V2. Current mobile navigation also contains buttons whose visual presence is not matched by behavior.

The completion condition is therefore capability parity, not page count.

## Architectural decision

Use **Approach A: native 1:1 parity**.

For every protected legacy capability:

1. identify its user-visible behavior and data contract;
2. map it to one canonical Portal V2 page or shared V2 capability;
3. implement that behavior natively in Portal V2;
4. add automated parity coverage;
5. verify desktop and mobile interaction;
6. verify exact production deployment/readback.

No compatibility bridge may navigate to, embed or fetch a legacy portal UI.

## Source of truth during migration

The migration has three sources of truth:

- `klantportaal.html`: behavioral/reference implementation of legacy customer-facing capabilities;
- `.github/scripts/portal_parity.py`: protected legacy capability baseline that must not be silently lost;
- `portal-v2/page-registry.js`: canonical V2 destination registry.

Where `klantportaal.html` contains richer behavior than the current parity script, the richer behavior is included in the migration backlog rather than ignored.

## Protected legacy capability baseline

### Protected panels

The following legacy panel identities are migration obligations:

1. `overzicht`
2. `profiel`
3. `dataai`
4. `aiscan`
5. `invoeren`
6. `antwoorden`
7. `business`
8. `cijfers`
9. `waarde`
10. `mensen`
11. `branche`
12. `onderzoek`
13. `beleid`
14. `aicap`
15. `strategie`
16. `canvassen`
17. `eindconclusie`
18. `dd`
19. `dna`
20. `bijhouden`
21. `wijzigingen`
22. `advies`
23. `offerte`
24. `roadmap`

### Protected global capabilities

These must remain available in Portal V2 where applicable:

- Netlify Identity/authentication semantics;
- logout;
- export;
- import;
- print behind the existing permission/access rule;
- feedback;
- customer branding;
- mobile navigation.

### Protected overview capabilities

The Portal V2 overview must retain the meaning and usefulness of:

- maturity level;
- manual work per year;
- FTE/capacity context;
- company state;
- CMMI/maturity visualization;
- adoption curve;
- leakage/loss visualization;
- blockers;
- progress;
- advice/recommendations.

The semantic wording must keep the capacity interpretation: time/capacity is not falsely presented as cash released. Annualization remains based on 46 working weeks where that model is used.

## Canonical legacy-to-V2 parity map

| Legacy capability | Canonical Portal V2 destination | Required behavior |
| --- | --- | --- |
| overzicht | `overzicht` | KPI overview, company state, maturity, blockers, progress, advice |
| profiel | `profiel` | profile/per-domain assessment with inspectable detail |
| dataai | `data-ai` | data + AI state, sources, quality, readiness and related actions |
| aiscan | `ai-scan` + `kansenkaart` | scan outcomes, opportunities, risks, prioritization |
| invoeren | `gegevens-invullen` | actual editable input flow, validation, save state |
| antwoorden | `ingevulde-gegevens` | readback of submitted answers/data and edit/revisit path |
| business | `businesscase` | business-case assumptions, value logic and scenario outputs |
| cijfers | `cijfers-maatstaven` | metrics/benchmarks with readable context and comparisons |
| waarde | `waarde-financiering` | value/financial logic and supporting explanation |
| mensen | `mensen` | people/team/knowledge dependency information |
| branche | `branche-markt` | market/industry context and benchmarks |
| onderzoek | `onderzoek` | research findings/evidence and source context |
| beleid | `compliance-governance` + `compliance-command-center` | governance/policy/compliance status, risks, actions, evidence |
| aicap | `ai-capabilities` | AI capability maturity, gaps, next steps |
| strategie | `strategiemodellen` + `strategie-naar-maandagochtend` | strategy model + translation to execution |
| canvassen | `canvassen` | canvas views/editing required by the legacy flow |
| eindconclusie | `eindconclusie` | final synthesis, priorities and recommendations |
| dd | `due-diligence` | due-diligence overview/evidence/risks |
| dna | `strategy-dna` | Strategy DNA interaction and state |
| bijhouden | `actueel-houden` | recency, monitoring and update workflow |
| wijzigingen | `wijzigingen` | activity/change history with usable detail |
| advies | `advies` | recommendations with rationale, priority and action path |
| offerte | `offerte` | offer/package selection, totals, delivery story and next action |
| roadmap | `roadmap` | roadmap timeline, tasks, progress and usable interactions |

Newer V2-native modules such as CSRD & Impact, Brain/Powerhouse, connector readiness, recovery obligations and audit trail remain additive and are not removed to achieve parity.

## Mobile navigation contract

The bottom bar is a primary navigation system, not decoration.

### Overzicht

Opens the native V2 overview and sets active state.

### Portaal

Opens the complete portal navigation surface, with all canonical portal pages grouped by user task. It must be possible to reach every parity destination without switching to a legacy shell.

### Data & AI

Opens a native hub for:

- Data & AI;
- data/source state;
- connectors;
- AI scan/opportunities;
- AI capabilities;
- Brain/Datahub/Powerhouse status where relevant.

### Taken

Opens a native execution hub for:

- tasks & workflows;
- active actions;
- roadmap;
- recovery obligations where the user has access;
- outcomes/evidence where relevant.

### Meer

Opens grouped access to all remaining portal pages, reporting, account and management functions.

All five buttons must:

- have explicit click behavior;
- reflect active state;
- be keyboard accessible;
- use a minimum 44×44 CSS pixel touch target;
- not cause horizontal overflow at supported mobile widths;
- preserve browser back/forward behavior through canonical V2 URLs/state.

## Desktop navigation contract

The desktop sidebar and mobile navigation use one shared routing model. No navigation item is allowed to be a static decorative button.

Every top-level desktop item must open a canonical V2 route or hub:

- Overzicht;
- CSRD & Impact;
- Bedrijfsgezondheid;
- Strategie & uitvoering;
- Processen & organisatie;
- Kennis;
- Data & koppelingen;
- AI & Insights;
- Acties & impact;
- Rapportages & beheer.

The sidebar may group several page IDs behind one hub, but every page must remain directly addressable.

## Data and state architecture

Parity is behavioral, not DOM-copying. V2 may reuse shared backend/domain logic, but must not reuse legacy UI as runtime content.

Use native V2 adapters with these responsibilities:

- read authenticated customer/project state;
- normalize existing persisted legacy-compatible data to V2 view models;
- write through canonical backend/store APIs;
- expose explicit loading, empty, partial and error states;
- never display hard-coded demo metrics as if they were authenticated customer facts;
- separate preview/demo state from production/customer state visibly and technically.

If a legacy capability has only local/in-page state and no canonical backend persistence, the migration task must first identify the intended persisted model before claiming parity.

## Shared V2 capability layer

Create or consolidate reusable native V2 capabilities for:

- router/navigation;
- authenticated portal state;
- form/save state;
- import/export;
- print/access permission;
- feedback;
- customer branding;
- loading/empty/error states;
- activity/audit context;
- action buttons and status badges.

Shared capabilities must be consumed by page modules rather than duplicated separately across 24 migrations.

## Import/export contract

Portal V2 must provide the same user outcome as the legacy import/export controls:

- export the relevant customer/project dataset in a deterministic supported format;
- import supported data only after validation;
- reject malformed or unsupported input safely;
- never expose provider secrets or server-only credentials;
- show completion/error feedback to the user;
- cover round-trip behavior with automated tests.

## Print/access contract

Print/report actions that were permission-gated remain permission-gated. A V2 page must not bypass access checks simply because it is a new implementation.

Print output must omit navigation chrome and preserve the core report information in a readable layout.

## Feedback contract

Feedback remains available from the V2 shell and includes enough context to identify:

- portal page;
- authenticated project/customer context where permitted;
- category/rating/message;
- success/failure submission state.

## Customer branding contract

Customer branding remains supported in the V2 shell without breaking Bedrijfsgeheugen product identity. At minimum the customer name/mark or safe initials fallback must render consistently where the legacy portal exposed it.

## Authentication and security

- Portal V2 remains protected by the current authentication model.
- No secrets may be included in client state or readiness payloads.
- Page access follows current role/permission constraints.
- Actions that mutate customer/project state must fail closed when authorization is missing.
- Legacy migration must not weaken existing NIS2/EU AI Act/compliance controls.

## UX rules

- Keep the current premium SaaS visual direction.
- Do not reproduce the legacy UI pixel-for-pixel; reproduce capability and meaning 1:1.
- Mobile layout is redesigned for the viewport rather than shrinking desktop layouts.
- Tables that do not fit mobile become cards, grouped rows or deliberate horizontally scrollable data regions with clear affordance.
- Primary actions are visible without requiring hidden hover states.
- Interactive controls meet minimum 44px mobile touch targets.
- Empty data is explicitly empty; example data is explicitly labelled preview/example.

## Parity test architecture

### 1. Static parity matrix

Add a machine-readable parity manifest defining every protected legacy capability, its V2 destination and required behavior markers. CI fails if a protected item has no V2 mapping.

### 2. Native implementation contract tests

For every parity destination, test that the page is native V2 and contains the required functional controls/state model. Route existence alone is insufficient.

### 3. Interaction tests

Use Playwright for user flows such as:

- all five mobile bottom-bar buttons;
- edit/save/readback for input data;
- roadmap interaction;
- offer interaction;
- import/export validation;
- print permission behavior;
- feedback submission state;
- customer branding;
- browser back/forward navigation.

### 4. Mobile device matrix

At minimum verify:

- 320×720;
- 360×800;
- 390×844;
- 430×932;
- landscape mobile;
- tablet portrait/landscape.

For key migrated flows assert:

- no page-level horizontal overflow;
- minimum touch target size;
- content remains readable;
- bottom bar does not cover actionable content;
- modal/sheet controls remain reachable.

### 5. Standalone architecture test

Continue to fail if V2 introduces:

- `/klantportaal` navigation;
- `portal-next` runtime dependency;
- legacy portal iframe;
- legacy UI fetch/embed fallback.

### 6. Production readback

After merge, production verification must prove:

- Netlify production `commit_ref` equals the exact merge SHA;
- canonical Portal V2 URL serves that deployment;
- representative desktop and mobile parity flows pass against production;
- the mobile bottom navigation works against production;
- no old portal request/navigation occurs.

## Migration sequence

### Phase 1 — Navigation and parity control plane

Build the parity manifest, shared router and fully working mobile/desktop navigation. This immediately fixes the currently dead bottom-bar controls and gives every migration a canonical destination.

### Phase 2 — Shared global capabilities

Migrate/authenticate shared shell functions: branding, feedback, import/export, print/access and reusable state/error handling.

### Phase 3 — Core input and evidence loop

Migrate `gegevens-invullen`, `ingevulde-gegevens`, `profiel`, `data-ai`, `ai-scan`, `kansenkaart`, `onderzoek` and related state/readback so the portal is driven by actual customer data rather than shell-only cards.

### Phase 4 — Business and strategy parity

Migrate business case, figures/benchmarks, value, people, market, strategy models, canvases, conclusion, Strategy DNA and due diligence.

### Phase 5 — Execution parity

Migrate actueel houden, wijzigingen, advies, offerte, roadmap and tasks/workflows. Ensure actions and progress mutate/read canonical state.

### Phase 6 — Compliance + additive V2 capabilities

Integrate existing compliance/CSRD/Brain/Powerhouse modules into the same routing/state model and make evidence/audit flows coherent with the migrated legacy capabilities.

### Phase 7 — Full parity gate and legacy retirement readiness

Run the complete parity matrix. Only when all obligations are green may Portal V2 be described as a full replacement. Legacy runtime removal/redirect decisions are a separate explicit release after parity proof.

## Release strategy

Use isolated branches/PRs so parity work can be delivered incrementally and does not block unrelated releases.

Each phase or coherent capability cluster must:

1. start from current `main`;
2. carry its own failing tests first;
3. keep the PR narrowly scoped;
4. pass Required/BRAIN/Portal V2 gates on the exact head;
5. merge without bypassing branch protection;
6. verify exact Netlify production SHA;
7. run production readback;
8. add regression/prevention for any discovered failure mode.

No phase may claim full parity until the complete matrix is green.

## Definition of done

Portal V2 is a true replacement only when all of the following are true:

- all 24 protected legacy panel capabilities have native V2 implementations;
- all protected global capabilities are present or deliberately superseded by an equivalent native capability;
- every V2 sidebar and bottom-bar item performs a real action;
- real customer/project data drives migrated views where applicable;
- import/export, feedback, branding and print/access flows work;
- mobile and desktop interaction tests are green;
- no old portal runtime dependency exists;
- Required and BRAIN gates are green on the exact candidate SHA;
- Netlify production is exact-SHA verified;
- production desktop/mobile readback is green;
- the complete machine-readable parity manifest reports zero open obligations.

Until then, UI presence or a 46-page registry is not sufficient evidence of completeness.
