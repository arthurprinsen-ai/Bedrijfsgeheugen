# Portal Next Complete Business OS — Design Specification

Date: 2026-09-07
Status: Approved design, implementation pending plan
Branch: `feature/portal-next-complete-business-os`

## 1. Objective

Build `portal-next` into the complete Bedrijfsgeheugen customer portal. The visual design of the approved portal overview mockup is the canonical frontend standard. The current IJsselmonde production portal remains untouched until a later, explicit migration decision.

The result must be one coherent Business OS in which existing customer-portal content and functionality, Datahub, AI Brain, Powerhouse, actions, outcomes, evidence, learning/writeback, self-heal and governance are visibly and functionally connected.

## 2. Non-negotiable product rules

1. The approved overview design is the visual source of truth.
2. No fallback to the old IJsselmonde visual design inside the new portal.
3. Every existing IJsselmonde page/function must have a first-class native view in the new portal; links to the old portal are temporary migration aids only.
4. Runtime truth is evidence-gated. No active flow, success, KPI, outcome or learning state may be claimed without runtime evidence.
5. Demo/example data may exist only in an explicit demo mode or route and must be visibly labeled as example data.
6. The current production route `/klantportaal?klant=ijsselmonde` must remain on the existing legacy customer portal throughout this project.
7. Mobile and desktop are both release requirements.
8. The final product must make causal traceability understandable: source -> processing -> decision -> action -> owner -> outcome -> evidence -> learning/writeback.

## 3. Canonical frontend overview

The portal overview page must reproduce the approved front-end composition as closely as practical in production HTML/CSS/JS:

- persistent left navigation with Bedrijfsgeheugen brand;
- welcome/header area with global search, AI command, notifications/help/profile and period selector;
- five KPI cards across the top;
- central `Het brein van je bedrijf` cockpit;
- right rail with AI Management Summary, Recommendations and Quick Links;
- bottom management cards for Roadmap & progress, Opportunities & threats, Impact overview;
- Recent activity strip;
- equivalent mobile navigation and responsive composition.

The canonical visual language is white/light-gray surfaces, dark navy text, electric-blue system emphasis, restrained green/orange/red semantic states, rounded cards, subtle shadows, consistent spacing, minimal line icons and high information density without losing legibility.

### 3.1 Overview system cockpit

The central cockpit must expose one connected execution chain:

`Sources -> Datahub -> AI Brain -> Powerhouse -> Portal module -> Action -> Outcome/Evidence -> Learning/Writeback -> Brain`

Sources include at minimum Systems, Documents, Processes, People, Dashboards, External data, Models and Canvases.

Portal output modules include at minimum Insight, Compare, Think, Acquisition, Do, Strategy DNA, Execution Canvas, Roadmap, Documents, Notes, Activity, Changes, Connections, Tasks & workflows, Hours & invoices and Keep current.

The cockpit must support selection/highlight behavior without falsely starting runtime. Dotted/animated flow lines only become active when runtime state supports the claim. Inactive or unavailable modules remain muted/blurred/idle.

## 4. Business OS information architecture

The new portal navigation is grouped around the Business OS rather than the legacy tab model:

- Overview
- Strategy
- Growth
- Operations
- Organisation
- Data & Technology
- Execution
- My work
- Model Library
- Trust & Governance
- Management

Within these workspaces, all existing customer portal pages are preserved as native views.

### 4.1 Existing content coverage

The new portal must include native views for at least:

#### Insight
- Overview
- Profile per component
- Data & AI
- AI scan
- Opportunity map
- Enter data
- Submitted data
- Business case

#### Compare
- Figures & benchmarks
- Value & financing
- People
- Industry & market
- Research
- Compliance, security & governance
- AI capabilities

#### Think
- Strategy models
- All models
- Canvases
- Final conclusion

#### Acquisition / ownership change
- Due diligence
- Exit

#### Do / execution
- Strategy to Monday morning
- Keep current
- Changes
- Advice
- Offer
- Roadmap
- Execution ladder
- Tasks & workflows

#### Brain & Powerhouse
- Source status
- Datahub status
- Brain processing
- Agent status
- Active actions
- Open recovery obligations
- Outcomes & evidence
- Learning/writeback
- Self-heal/recovery
- Audit trail

#### Management
- Connections
- Users
- Documents
- Settings
- Audit
- Hours & invoices / subscription where applicable

No page may be considered covered merely because it appears in a link map. Native content and interaction must be available in the new shell.

## 5. Page composition contract

Every relevant Business OS page uses three information layers.

### Layer 1 — Management view
Shows the concise status, KPI, risk, opportunity, decision or progress summary relevant to the page.

### Layer 2 — Operational view
Shows underlying items, owners, workflow, tasks, dependencies, status, timeline, source quality and next actions.

### Layer 3 — Trace & evidence
Makes the provenance and execution trace inspectable, including source, transformation/context, Brain processing, Powerhouse agent, action, owner, evidence, outcome classification and learning/writeback state.

The default view remains calm and management-readable. Detailed trace data is available by drill-down/drawer/detail panel instead of cluttering the primary composition.

## 6. Runtime truth model

The portal must never infer success from selection or presentation state.

Canonical statuses include at least:
- idle
- queued
- running
- waiting
- blocked
- failed
- recovering
- completed
- verified
- disconnected

Rules:
- `success`/`completed` without evidence is not displayed as verified;
- paused/disabled execution with an open recovery obligation is blocked;
- self-heal in progress is recovering;
- verified requires acceptable evidence;
- missing runtime evidence produces idle/unavailable/not verified, never simulated activity;
- visual flow animation is driven by normalized runtime state, not by clicks alone.

## 7. Traceability and causal links

Every recommendation, alert, decision and action should be able to expose a structured trace where data exists:

1. triggering source(s);
2. Datahub normalization/enrichment context;
3. Brain insight/reasoning artifact or decision context;
4. Powerhouse agent and category;
5. generated/recommended action;
6. owner and due/review state;
7. observed outcome;
8. evidence identifier(s);
9. learning/writeback state;
10. prevention/recovery obligation if relevant.

Traceability is an explanation interface, not permission to expose restricted raw data. Authorization is enforced before rendering/exporting detail.

## 8. Data and identity model

Production mode must not contain hard-coded customer truth such as Arthur Prinsen, KPI 72/100, EUR 1.24M or sample recommendations unless those values come from authenticated customer runtime data.

The shell may show neutral empty states such as:
- No verified data
- Not available
- Waiting for source
- No evidence
- Not calculated

Demo mode can load a separate explicit fixture and carries a persistent `Example`/`Demo` label.

Customer/tenant identity is derived from the authorized portal context. URL parameters may preserve routing context but must not independently establish authorization.

## 9. Legacy migration strategy

`portal-next` currently contains a legacy bridge. This is treated as transitional only.

Migration order:
1. inventory legacy page behavior and data contracts;
2. implement the native equivalent in `portal-next`;
3. compare content/function coverage;
4. add regression test proving native coverage;
5. only then remove that page's dependency on the legacy bridge.

A direct legacy route remains available during development for comparison and fallback testing. The IJsselmonde public production route is not changed by this project.

## 10. Interaction contract

- Clicking a source/module selects/focuses it; it does not claim execution.
- Explicit demo action may show a sample route and is visibly labeled.
- Runtime events can light the matching nodes/edges/statuses.
- Recommendation cards open their source/trace/action detail.
- KPI cards open the relevant workspace/detail without losing customer context.
- Quick links navigate to native Business OS views.
- Search spans portal content that the current user is allowed to access.
- AI command sends the question only through the authorized AI contract; server-side context determines tenant data.
- Mobile interactions use touch-safe hit areas and do not hide essential text behind sliders/overlays.

## 11. Component boundaries

Implementation should preserve focused modules rather than expanding one monolithic script.

Target responsibilities:
- `portal-next/index.html`: semantic shell/overview structure only;
- `portal-next/portal-next.css`: canonical overview shell styles;
- `portal-next/workspaces.css`: workspace/page layout system;
- `portal-next/portal-next.js`: routing, shell orchestration and interaction wiring;
- `portal-next/portal-content-map.js`: canonical page taxonomy and metadata;
- `portal-next/portal-powerhouse-adapter.js`: normalized runtime/evidence mapping;
- dedicated data/view modules for KPI, recommendations, activity, trace/evidence and legacy/native coverage as implementation requires;
- shared render helpers for status, empty state and detail drawers.

No unrelated website-shell refactor is part of this project.

## 12. Testing and release gates

### 12.1 Unit / contract tests
Must cover:
- complete page taxonomy;
- no missing legacy-page equivalents;
- runtime/evidence status normalization;
- no active flow from selection only;
- production ban on fixture customer facts;
- customer parameter preservation;
- legacy bridge cannot recurse into portal-next;
- IJsselmonde production route remains legacy;
- trace model fields and state classification;
- auth/context boundaries.

### 12.2 Visual tests
Exact Portal Next preview checks on:
- approved desktop viewport;
- representative mobile viewport;
- navigation/sidebar/mobile nav;
- KPI row;
- central cockpit geometry;
- right rail;
- bottom management cards;
- overlays/drawers with readable content;
- no overlap, clipped text or unreadable slider states.

### 12.3 Functional tests
- every primary nav item opens a native view;
- every mapped current page can be reached;
- back/forward navigation preserves state/customer context;
- trace/evidence drill-down works;
- demo route is distinct from production mode;
- no fake runtime on selection;
- inactive flows remain inactive;
- legacy comparison link remains reachable during migration.

### 12.4 Release gates
The implementation branch remains isolated until all required repository CI, Portal V2/Portal Next preview checks, live preview smoke, BRAIN delivery classification and exact-head checks are green.

The new portal may be deployed as an isolated production-hosted route for review, but the IJsselmonde route stays unchanged.

## 13. Definition of complete

This project is complete only when all of the following are true:

1. The Portal Next overview visually matches the approved front-end design at release viewports.
2. Every current IJsselmonde content/function area exists natively in the new portal.
3. The Business OS navigation exposes those areas coherently.
4. Brain/Datahub/Powerhouse/action/outcome/evidence/learning relationships are visible and inspectable.
5. Runtime claims are evidence-gated.
6. Normal production mode has no fictitious customer truth.
7. Desktop and mobile verification pass.
8. Legacy bridges are removed per page only after native parity is proven.
9. IJsselmonde remains on its current production portal.
10. Release evidence identifies the exact commit deployed to the isolated new portal route.

## 14. Explicitly out of scope

- Migrating IJsselmonde to the new portal.
- Replacing real backend evidence with generated/demo data.
- Redesigning the public Bedrijfsgeheugen marketing website.
- Broad Powerhouse/Brain backend rewrites unrelated to the portal contracts.
- Removing the legacy portal before native parity is verified.
