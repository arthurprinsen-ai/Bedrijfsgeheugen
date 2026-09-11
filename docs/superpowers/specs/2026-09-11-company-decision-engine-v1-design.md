# Company Decision Engine v1 — canonical design

Date: 2026-09-11
Status: approved design, implementation not yet started
Repository baseline: `74701a8d11c01a402be5487335fd500be570b9e5`

## 1. Goal

Make Bedrijfsgeheugen Portal V2, Brain, Powerhouse, Supabase and Notion operate as one closed decision system that can explain how a company works, identify problems and opportunities, determine what should happen first, estimate value and cost, execute or hand off actions, measure outcomes, learn, and reprioritize.

The system must stay simple to understand: one canonical truth, one decision contract, one prioritized view, and explicit evidence for every claim.

## 2. Non-goals

- No second AI brain next to the existing Brain runtime.
- No new parallel persistence path next to canonical Supabase state.
- No Make dependency in the critical decision path.
- No LLM-generated financial figures without deterministic evidence.
- No Notion-owned runtime state; Notion remains projection, control surface and audit trail.
- No `done`, `live`, `fixed` or `verified` claim without runtime or production readback.

## 3. Existing foundations to preserve

The implementation extends these existing contracts rather than replacing them:

- Supabase as canonical Brain/data/runtime store.
- `brain/decision/score.mjs` as the expected-utility scoring primitive.
- `brain/decision/policy.mjs` as the decision guard/policy primitive.
- Existing calibration and learning logic.
- Portal V2 canonical domain state and persistence.
- `/api/brain-operating-loop` as runtime projection into Portal V2.
- The 100-calculation Portal parity engine and existing visual models.
- External-data and regulation registries with provenance/freshness metadata.
- Powerhouse closed-loop constitution.

## 4. Canonical architecture

```text
Internal company data
External data / regulation
Runtime evidence
Human outcomes
Portal input
        |
        v
Evidence normalization + provenance
        |
        v
Company graph + dependencies
        |
        v
Deterministic calculations
        |
        v
Findings: problems / opportunities / root causes
        |
        v
Intervention candidates
        |
        v
Company Decision Engine
  - policy guards
  - expected utility
  - dependency ordering
  - scenario / business case
  - confidence
        |
        v
Canonical priority portfolio
  NOW / NEXT / LATER / DO NOT DO
        |
        +--------------------+
        |                    |
        v                    v
Portal V2              Notion projection
        |                    |
        +---------+----------+
                  v
               Action
                  |
                  v
           Evidence / outcome
                  |
                  v
          Realized value
                  |
                  v
      Calibration / learning
                  |
                  +----> next decision
```

There is one canonical decision object. Portal and Notion render that object; they do not recompute their own business truth.

## 5. Canonical evidence contract

Every material input used for a recommendation must be representable as:

```js
{
  evidence_id,
  tenant_id,
  subject_id,
  source_type,
  source_ref,
  observed_at,
  source_date,
  valid_until,
  freshness,
  confidence,
  quality,
  scope,
  graph_links,
  value,
  unit,
  verified,
  provenance_chain
}
```

Rules:

1. Stale evidence must reduce confidence or trigger `WATCH/RESEARCH`.
2. Unverified external data may inform context but must not dominate investment decisions.
3. Every displayed hard figure must retain source/provenance.
4. Missing evidence is explicit; never substitute demo data.
5. Tenant identity is derived server-side and cannot be selected by the browser for writes.

## 6. Company graph

The company graph is the shared semantic layer linking at minimum:

- strategy and goals;
- departments and roles;
- processes and tasks;
- capabilities;
- data entities and sources;
- systems and integrations;
- customers / market / products;
- financial drivers;
- risks / controls / regulations;
- initiatives / roadmap / features / stories;
- actions / owners / outcomes;
- recommendations and evidence.

The graph must support explicit dependency edges and causal hypotheses. A causal hypothesis is not promoted to a proven relation until outcome evidence and calibration support it.

The graph must be cycle-safe for execution dependencies. Cycles are surfaced as blockers, not silently broken.

## 7. Finding contract

A finding is the normalized output of calculations, runtime analysis, external comparison or AI synthesis.

```js
{
  finding_id,
  tenant_id,
  type,                  // problem | opportunity | risk | obligation
  title,
  explanation,
  root_causes,
  affected_graph_nodes,
  evidence_ids,
  confidence,
  severity,
  urgency,
  strategic_fit,
  do_nothing_cost,
  detected_at,
  status
}
```

AI may propose root-cause hypotheses and summarize evidence, but must not fabricate facts or figures.

## 8. Intervention candidate contract

Every candidate considered by the decision engine must normalize to:

```js
{
  candidate_id,
  tenant_id,
  finding_ids,
  type,
  title,
  action,
  owner,
  dependencies,
  expected_value,
  success_probability,
  confidence,
  evidence_quality,
  evidence_freshness,
  urgency,
  strategic_fit,
  learning_value,
  reusability,
  cost,
  opportunity_cost,
  risk,
  time,
  capacity,
  payback_months,
  do_nothing_cost,
  hard_boundary,
  budget_ok,
  contact_pressure_ok,
  production_red,
  data_integrity_red,
  provenance
}
```

This contract is the adapter between Portal calculations, Brain runtime, company graph and the existing `scoreCandidate()` / `decide()` functions.

## 9. Canonical Decision object

The Decision Engine produces one object per candidate:

```js
{
  decision_id,
  candidate_id,
  decision,              // FIX | BUILD | TEST | OPTIMIZE | RESEARCH | WATCH | PAUSE | ...
  lane,
  score,
  portfolio_bucket,      // NOW | NEXT | LATER | DO_NOT_DO
  rank,
  reasons,
  blocked_by,
  dependency_state,
  expected_value,
  investment,
  capacity,
  duration,
  payback_months,
  do_nothing_cost,
  risk,
  confidence,
  evidence_ids,
  assumptions,
  owner,
  next_action,
  created_at,
  valid_until,
  dedupe_key
}
```

The reason chain must be human-readable and machine-testable.

## 10. Priority algorithm

Ordering is deterministic after candidate normalization.

1. Hard safety/security/data-integrity/production conditions run through existing policy first.
2. Invalid or stale evidence is routed to research/watch rather than execution.
3. Execution dependencies are topologically ordered; a blocked prerequisite cannot rank behind its dependent action.
4. Existing `scoreCandidate()` produces expected-utility score.
5. The portfolio layer applies capacity and budget constraints.
6. Items are grouped into:
   - `NOW`: executable, high-value, dependency-ready;
   - `NEXT`: valuable but dependent on NOW work or near-term capacity;
   - `LATER`: positive but lower marginal utility;
   - `DO_NOT_DO`: blocked, negative opportunity cost, superseded or unsupported.
7. Ties are broken deterministically using confidence, do-nothing cost, strategic fit and stable ID.

No LLM decides final numeric rank.

## 11. Scenario and business-case layer

Each executable recommendation must expose, when evidence permits:

- baseline;
- target state;
- investment;
- implementation capacity;
- duration;
- annual expected value;
- do-nothing cost;
- payback;
- risk;
- confidence interval / confidence score;
- dependency effects;
- enabling value for downstream work.

Existing Portal calculations remain authoritative where they already provide these values. The new layer composes them; it must not fork formulas.

## 12. AI role and governance

AI is used for:

- extracting structure from unstructured sources;
- matching signals to company-graph nodes;
- proposing root-cause hypotheses;
- generating intervention options;
- explaining deterministic decisions in plain language;
- summarizing scenario differences;
- identifying missing evidence.

AI is not used as the primary source for:

- financial arithmetic;
- final priority score;
- tenant identity;
- compliance status without evidence;
- production/live status;
- realized outcome value.

Model invocation follows the existing provider/governance registry. Unregistered models fail closed.

Model escalation remains value-aware: deterministic / query / statistical paths first; larger models only when the existing cost/confidence/complexity policy warrants it.

## 13. Portal V2 information architecture

The user-facing experience must become simpler, not larger.

### 13.1 Directiecockpit

Top-level answer to five questions:

1. How is the company doing now?
2. What are the biggest problems/risks?
3. What are the biggest opportunities?
4. What value is currently being left on the table?
5. How reliable is this picture?

### 13.2 What to do first

One prioritized board with four buckets:

- Nu
- Daarna
- Later
- Niet doen

Every item shows only the decision-critical facts by default:

- why;
- expected value;
- investment/capacity;
- duration;
- confidence;
- blocking dependency;
- owner / next action.

Expandable detail contains evidence, formulas, source dates, assumptions and graph context.

### 13.3 Company map

A graph-oriented company view connecting strategy, people, process, data, systems, AI, market/customer, finance, compliance and delivery.

It is not a decorative graph. Selecting a node must show related findings, metrics, dependencies, actions and outcomes.

### 13.4 Scenario view

Allow comparison of a small number of concrete intervention portfolios. Do not introduce a generic simulation platform.

### 13.5 Results view

For each executed recommendation show expected versus realized value, prediction error, evidence and learned policy effect.

## 14. Portal interaction telemetry

Portal V2 must join the existing privacy-light first-party measurement path.

Capture at minimum:

- route/page view;
- action/card clicks;
- priority item opened;
- evidence details opened;
- scenario changed;
- action accepted/rejected/deferred;
- form/workflow completion;
- active time;
- relevant errors.

Do not capture field values containing personal or confidential content.

Telemetry becomes evidence for UX and recommendation usefulness, not direct proof of business value.

## 15. Notion integration

Notion remains a projection/control surface.

The canonical projection contains:

- top priorities and portfolio bucket;
- evidence confidence and freshness;
- open blockers;
- expected versus realized value;
- decisions and owners;
- learnings;
- next decisions;
- runtime/release health.

Rules:

1. Runtime truth lives in Supabase, never only in Notion.
2. Sync is idempotent using stable IDs/dedupe keys.
3. Write success is not enough: a write/readback must confirm the projected state.
4. Notion permission failures create one deduplicated obligation, not retry spam.
5. Existing historical pages are not bulk rewritten; the canonical projection and constitution govern new behavior.

## 16. Closed-loop execution

Every recommendation follows:

`signal → context → decision → action → execution → verification → outcome → value → learning → next decision`

Required writeback fields:

- input/signal;
- decision owner;
- action;
- evidence;
- outcome;
- realized value;
- learning effect;
- next decision;
- dedupe key;
- rollback/recovery;
- cost signal;
- health signal.

An action without an outcome route is invalid for autonomous execution.

## 17. Calibration and realized value

Predicted value must be compared with realized value on defined horizons where applicable.

The learning loop updates:

- confidence calibration;
- causal certainty;
- expected success probability;
- evidence-source reliability;
- future candidate score inputs;
- recommendation explanation.

Learning never silently rewrites historical decisions; it affects future decisions and retains audit history.

## 18. Failure behavior

Fail closed where false confidence is dangerous.

Examples:

- missing source provenance → show unsupported / research required;
- stale external source → reduce confidence / watch;
- no runtime projection → empty runtime state, never demo values;
- Notion unavailable → runtime continues, projection marked stale;
- AI provider unavailable → deterministic decisions continue when possible;
- dependency cycle → blocked portfolio with explicit cycle;
- business-case inputs incomplete → no invented ROI;
- production mismatch → no LIVE claim.

## 19. Data migration and compatibility

No destructive migration is required for Portal V2 parity state.

Implementation should add adapters/projections around existing data first. New canonical tables/columns may be introduced only where existing Brain tables cannot represent the contracts without ambiguity.

Legacy and historical records remain readable for audit. Duplicate runtime paths are deprecated only after replacement readback proves parity.

## 20. Testing strategy

### 20.1 Unit tests

- evidence normalization;
- freshness/confidence;
- candidate adapter;
- existing score compatibility;
- dependency ordering and cycle detection;
- portfolio bucketing;
- deterministic tie breaking;
- business-case composition;
- AI-output schema validation;
- Notion projection and dedupe.

### 20.2 Golden-master tests

Use representative company fixtures to prove that known input changes produce exact expected changes in:

- calculations;
- findings;
- candidate values;
- priority ordering;
- graphs/visuals;
- business case;
- explanations.

### 20.3 Integration tests

Prove:

`portal input → server persistence → calculations → Brain decision → runtime projection → Portal rendering`

and:

`decision → outcome → realized value → calibration → reprioritized decision`.

### 20.4 Notion integration tests

- permission/auth failure;
- idempotent create/update;
- readback equality;
- stale projection marker;
- deduplicated blocker obligation.

### 20.5 Browser tests

Desktop and mobile:

- all primary navigation;
- priority bucket interactions;
- graph selection;
- scenario controls;
- action accept/defer/reject;
- persistence after reload;
- telemetry emission;
- no overlap/clipping/covered controls;
- no console errors.

### 20.6 Production readback

Release is only complete when exact deployed commit is proven and production readback verifies:

- Portal assets/version;
- decision endpoint/runtime health;
- representative priority rendering;
- interaction success;
- telemetry endpoint;
- no demo fallback;
- Notion projection state when credentials/permission are available.

## 21. End-to-end acceptance fixture

One canonical test company must prove the whole system.

Required scenario:

1. Seed company with strategy, people, process, financial, system and market data.
2. Verify baseline metrics and visualizations.
3. Introduce a material change, such as deteriorated DSO/process time or improved maturity.
4. Verify affected calculations change.
5. Verify external benchmark comparison changes where applicable.
6. Verify finding/root-cause candidates change.
7. Verify priority ordering changes deterministically.
8. Verify recommendation business case and dependencies update.
9. Accept one action and persist it.
10. Verify Brain operating loop sees the action.
11. Record execution evidence and outcome.
12. Record realized value.
13. Verify calibration/learning changes future candidate inputs.
14. Verify next decision/rank changes.
15. Verify Portal and Notion project the same canonical decision state.

This fixture is the primary definition of “everything works together”.

## 22. Delivery sequence

Implementation should be split into atomic releases while preserving one architecture:

1. Canonical contracts and decision adapter.
2. Company dependency graph and portfolio ordering.
3. Business-case composition and confidence/provenance.
4. Runtime API projection and Portal priority UI.
5. Outcome/value/calibration closed loop.
6. Portal telemetry.
7. Notion canonical projection and readback.
8. End-to-end acceptance fixture.
9. Production release/readback and Brain/Notion learning writeback.

Each release must pass Required gates on one exact SHA and get production evidence before its capability is called live.

## 23. Definition of Done

The Company Decision Engine is complete only when the canonical acceptance fixture proves, on production-equivalent paths:

`input change → correct calculations → correct visuals → contextual benchmark → finding/root cause → candidate → dependency-aware priority → business case → persisted action → Brain runtime → outcome → realized value → learning/calibration → changed next decision → identical Portal/Notion projection`.

Additionally:

- no hidden demo figures;
- no open critical parity obligations;
- no competing priority engines;
- no unregistered AI model on the path;
- no direct browser-controlled tenant write;
- all decision figures have provenance;
- stale/weak evidence is visible;
- desktop and mobile interactions work;
- exact production SHA/deploy is read back;
- any escaped defect has a regression guard and learning writeback.

## 24. Simplicity rule

When two implementations satisfy the same evidence and closed-loop contract, choose the one that introduces fewer stores, fewer APIs, fewer decision rules and fewer user-facing concepts.

The user experience must answer one core question without requiring knowledge of the architecture:

**“Hoe staat mijn bedrijf ervoor, wat moet ik als eerste doen, waarom, en wat levert het aantoonbaar op?”**
