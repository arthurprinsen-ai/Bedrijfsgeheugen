# Powerhouse Revenue Intelligence OS v2 — Design

Date: 2026-09-15
Status: proposed for implementation
Owner: Bedrijfsgeheugen Powerhouse

## Objective

Extend the existing Bedrijfsgeheugen Powerhouse closed loop into a revenue-intelligence operating system that continuously understands people, companies, accounts, buying windows, relationship state, content influence and commercial outcomes, then chooses and learns the best next action across channels.

This is an extension of the existing canonical chain, not a parallel CRM or second brain:

`signals/runtime events -> person/company intelligence -> opportunities -> buying windows -> account reasoning -> next best action -> sales actions -> observed outcomes -> forecasts/calibration -> sales learnings -> next decision`

Supabase remains the transactional source of truth. Existing Notion projection remains knowledge/audit-facing. Existing autonomous growth/revenue, revenue-flywheel, prediction, calibration and live-readback components are reused.

## Non-negotiable invariants

1. EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
2. No new parallel CRM, brain, analytics store, calendar, queue or learning system when a canonical Powerhouse component already exists.
3. No fabricated person facts, company facts, intent, outcomes, clicks, meetings, proposals, wins or revenue.
4. External outcomes stay pending until observed through an evidence-bearing readback.
5. Every executable commercial action has pre-action forecast lineage.
6. Every observed outcome attempts calibration against the forecast and updates learning evidence.
7. Identity, truth, contact-pressure, channel-identity, safety, dedupe and delivery gates are fail-closed.
8. LinkedIn jobs/hiring content is not forced into public-comment sales activity.
9. Public comments remain contextual/expert; sales assets and hard CTAs are not injected into public comments.
10. Human-send remains the default for LinkedIn outbound unless an explicitly authorized provider route and readback contract exist.
11. A daily run may be marked complete only after execution/readback obligations are resolved or explicitly recorded as blocked/error.
12. Runtime states and learning statuses must reuse existing database constraints.

## Capabilities to complete

### 1. Person intelligence

Extend the existing `powerhouse_person_intelligence_v1` derivation so each known person can accumulate evidence-backed fields or projections for:

- current company/role and freshness;
- relationship warmth and last interaction;
- topics/problems repeatedly discussed;
- observed engagement/reply behaviour;
- likely influence in a buying process, expressed as a prediction with confidence rather than fact;
- previous messages/actions/outcomes;
- content and asset exposure when actually observable;
- preferred/working channel and timing only when learned from evidence;
- open follow-up/readback obligations.

All derived assertions keep provenance/freshness/confidence.

### 2. Company intelligence and external research

Extend `powerhouse_company_intelligence_v1` with evidence-backed aggregation over people plus external public signals such as news, vacancies, leadership changes, growth/funding/M&A where available, website changes, public strategy language and relevant market/search signals.

When information is missing, low confidence creates a research obligation instead of a guess. Research results are ingested as canonical runtime/predictive evidence and re-score the same company/opportunity.

### 3. Account intelligence graph and buying committee

Introduce derived account reasoning over the existing person/company keys. It must identify, as predictions with confidence:

- likely champion/influencer/blocker/economic-buyer roles;
- shared problem themes across multiple people at one company;
- relationship paths and warm-introduction possibilities when supported by known graph evidence;
- account-level buying-window evidence;
- contradictions and missing evidence.

No inferred buying-committee role may be presented as a known fact without direct evidence.

### 4. Account-level next-best-action

Extend the existing `powerhouse_commercial_next_best_action_v2` logic to coordinate across an account, not just an isolated person. Example output can recommend: comment to person A now, do not contact person B yet, research C, ask for an introduction through D, or follow up with E after an evidence-based cooldown.

Ranking objective: expected downstream commercial value, constrained by brand/truth/contact pressure/safety/delivery and uncertainty penalties.

### 5. Buying-window and intent prediction

Reuse `powerhouse_buying_window_v2` and `powerhouse_forecasts` to score problem fit, timing, role influence, relationship fit, strategic fit, probability/confidence and expected lead time. Prediction must be calibrated only against observed outcomes.

### 6. Contact-pressure and timing learning

Derive per-person/account pressure state from prior actions, channels, recency, replies/non-replies and outcomes. The system may recommend `no_action` or delayed follow-up. More activity is not an objective.

### 7. Multichannel sales orchestration

Use one canonical action model for:

- expert comment;
- LinkedIn DM;
- e-mail;
- warm introduction request;
- content/asset share;
- meeting CTA/follow-up;
- research first;
- wait/no-action.

Channel selection is dynamic and outcome-learned. Execution requires an authorized channel path and provider/readback evidence. Unsupported execution stays queued for human action rather than being falsely marked sent.

### 8. Commercial evidence/asset selection

Reuse `powerhouse_content_artifacts` as the proof/asset catalogue. Assets carry metadata for problem, audience, funnel stage, language, evidence strength, freshness and intended CTA. No generic brochure-by-default behaviour.

The smallest relevant evidence should be selected. Missing assets create an explicit content/evidence obligation; no fabricated case result or customer proof.

### 9. Content-to-sales causal lineage

Link content/runtime events, person/account interaction, action, opportunity and outcome keys so Powerhouse can evaluate whether content influenced a reply, meeting, proposal or realized revenue. Attribution confidence is explicit. Correlation must not be presented as causal proof.

### 10. Outcome capture and calibration

Expand the existing outcome sweep/readback path so actionable stages include at least observed reply, positive reply, meeting, proposal, won, lost and realized revenue where verifiable.

For each observed outcome:

- resolve matching action/opportunity/person/company lineage;
- calibrate eligible pre-action forecast;
- record Brier/probability/timing/revenue evidence where applicable;
- update strategy-performance samples;
- write or update sales learning with sample size and confidence;
- preserve the raw observed event.

No synthetic outcomes are generated to create training volume.

### 11. Revenue experimentation

Reuse existing experiment queues and learning tables. Experiments may vary problem framing, message strategy, CTA, asset, channel, timing and sequence subject to guardrails. Optimization hierarchy:

1. realized revenue;
2. won/proposal/meeting;
3. positive reply;
4. calibration quality and qualified-opportunity lift;
5. engagement only as an intermediate signal.

Experiments require assignment lineage and observed outcome evidence. Low sample sizes remain exploratory.

### 12. Revenue Command Center

Provide one derived daily decision surface over existing data. It prioritizes the limited set of actions most worth doing now and shows:

- person/company/account;
- recommended action/channel;
- reason and evidence summary;
- probability/confidence;
- expected value;
- recommended asset/CTA;
- contact-pressure state;
- next due time;
- execution/readback state;
- blocked/research-needed reason.

The command center is a projection, not a new source of truth.

### 13. Daily autonomous cycle and health

The existing daily jobs remain authoritative. Extend health/readback so a daily run reports at minimum:

- intelligence refreshed;
- research obligations created/resolved;
- opportunities/buying windows scored;
- account NBA produced;
- executable actions materialized;
- pre-action forecasts present;
- provider/human execution state;
- outcomes/readback obligations;
- calibration count due/completed;
- learnings applied;
- structural gaps;
- content/publication execution state.

The current degraded daily-run condition must be fixed by addressing the real unresolved execution/readback cause; it must not be overwritten to green.

## Data-model strategy

Prefer views/functions over new tables where state can be derived from existing canonical data. New durable tables are allowed only for information that cannot safely live in existing canonical structures, e.g. explicit research obligations/account plans if no current table supports their semantics. New objects must include dedupe keys, evidence, confidence/freshness where applicable, lifecycle constraints, indexes and RLS/security review.

Primary existing objects to reuse:

- `powerhouse_runtime_events`
- `powerhouse_person_intelligence_v1`
- `powerhouse_company_intelligence_v1`
- `powerhouse_opportunities`
- `powerhouse_buying_window_v2`
- `powerhouse_commercial_next_best_action_v2`
- `powerhouse_sales_actions`
- `powerhouse_sales_outcomes`
- `powerhouse_forecasts`
- `powerhouse_forecast_calibration`
- `powerhouse_sales_learnings`
- `powerhouse_sales_strategy_performance_v1`
- `powerhouse_content_artifacts`
- `powerhouse_content_recommendations`
- `powerhouse_predictive_signals`
- `powerhouse_experiment_decision_queue_v1`
- `powerhouse_outcome_sweep_queue_v1`
- `powerhouse_gap_register_v1`
- `powerhouse_daily_runs`
- existing revenue/social learning tables and the autonomous revenue flywheel.

## Execution and feedback contract

Every important commercial decision must be reconstructable from evidence:

`observation -> derived intelligence -> decision -> prediction -> action -> delivery/readback -> downstream outcome -> calibration -> learning -> changed next decision`

If one link is absent, the system records an obligation/gap instead of claiming a closed loop.

## Rollout

Implementation will be incremental behind canonical SQL/functions/views and existing runtime jobs:

1. regression tests for invariants and missing capabilities;
2. account/person/company intelligence derivations;
3. research obligations and uncertainty handling;
4. account-level NBA/contact-pressure;
5. multichannel/evidence orchestration;
6. outcome/calibration/experiment integration;
7. Revenue Command Center and health readback;
8. production migration/function deployment;
9. CI/required gates;
10. merge to protected `main`;
11. production re-run/readback;
12. write `release_verified` runtime event and Powerhouse learning with merge SHA/evidence;
13. Supabase security/performance advisor review.

## Acceptance criteria

The release is `LIVE & BEWEZEN` only when all applicable conditions are observed in production:

- required GitHub checks green and merge on current `main`;
- deployed database/function definitions match the release contract;
- person/company intelligence refresh succeeds;
- account-level decisions are materialized with evidence and dedupe;
- every executable commercial action has forecast lineage;
- unsupported/human actions are not marked delivered;
- actual outcomes, when present, flow into calibration and learning;
- research uncertainty becomes obligations rather than invented intelligence;
- command-center rows are generated from canonical state;
- daily-run status truthfully reflects outstanding publication/execution obligations;
- gap closer shows no unmanaged structural gaps attributable to this release;
- security/performance advisor findings introduced by this release are addressed or explicitly blocked;
- canonical release event and learning writeback contain production evidence.

## Explicit non-goals

- manufacture outcomes to increase learning volume;
- scrape or infer sensitive/private facts about people;
- mass-send generic LinkedIn outreach;
- bypass LinkedIn/platform controls;
- replace Supabase/Notion with a parallel CRM;
- optimize for posting or outreach volume as an end in itself;
- call a release live solely because code was merged.
