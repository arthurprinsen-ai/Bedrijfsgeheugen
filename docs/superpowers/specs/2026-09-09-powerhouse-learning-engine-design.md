# Powerhouse Learning Engine — Design

## Status
Approved architecture for implementation on `feature/powerhouse-learning-engine`.

## Goal
Replace Make as the critical-path learning layer for social/content optimization with a native Powerhouse subsystem that continuously measures real outcomes, derives evidence-bounded learnings, feeds those learnings into BRAIN before content generation, and proves whether applied learnings improve later outcomes.

## Non-goals
- Do not replace all Make scenarios in one migration.
- Do not make likes/reach the primary optimization objective.
- Do not allow unverified AI-generated conclusions to become canonical learnings.
- Do not create a parallel memory outside the shared BRAIN context.
- Do not weaken existing BRAIN delivery, outcome-obligation, idempotency, security, cost, or production-verification contracts.

## Architectural decision
Use the existing Bedrijfsgeheugen BRAIN event ingress as the immutable/audit boundary, add an analytical learning store in Supabase/Postgres, and run the learning/evaluation logic in native serverless code in the repository. Netlify Functions remain the HTTP/runtime boundary where appropriate; Supabase provides relational history and cohort analysis. Make becomes an optional edge integration only and is removed from the critical learning path.

Canonical flow:

`platform outcome -> social outcome ingest -> BRAIN event store -> analytical store -> 24/48/72 evaluator -> learning engine -> learning registry -> BRAIN context projection -> content decision engine -> published post -> platform outcome`

## Existing foundations to preserve
- `netlify/functions/_brain-event-store.mjs` remains the idempotent BRAIN event persistence boundary.
- Existing Supabase store patterns under `netlify/functions/` are reused instead of introducing another persistence abstraction.
- `AGENTS.md`, `BRAIN-DELIVERY-v2`, shared-context read/writeback, outcome obligations, and green-until-done remain binding.
- Existing Make BG199/BG184/BG202/PH15 flows are migration sources and compatibility adapters, not the new source of truth.

## Data model

### `social_posts`
One canonical record per published content unit.

Required fields:
- `post_id` UUID/text stable identifier
- `platform` enum: `linkedin_personal`, `linkedin_company`, `instagram`, extensible later
- `external_post_id`
- `published_at`
- `content_hash`
- `topic`
- `content_pillar`
- `audience`
- `funnel_stage`
- `format`
- `hook_type`
- `narrative_type`
- `emotion`
- `cta_type`
- `source_campaign_id` nullable
- `created_at`

### `social_metric_snapshots`
Immutable metric observations for a post at a point in time.

Required fields:
- `snapshot_id`
- `post_id`
- `observed_at`
- `age_hours`
- raw metrics when available: `impressions`, `reach`, `likes`, `comments`, `shares`, `saves`, `clicks`, `profile_visits`, `followers_gained`, `dms`, `leads`, `qualified_leads`, `meetings`, `offers`, `orders`, `revenue`
- `source`
- `source_event_id`
- `data_quality`

Snapshots are append-only. Corrections create a new snapshot/event; historical evidence is not silently rewritten.

### `social_experiments`
Tracks explicit test intent.

Required fields:
- `experiment_id`
- `hypothesis`
- `primary_metric`
- `comparison_scope`
- `started_at`
- `ended_at` nullable
- `status`: `ACTIVE`, `COMPLETE`, `ROLLED_BACK`, `INSUFFICIENT_EVIDENCE`

### `social_learnings`
Canonical reusable component-level learnings.

Required fields:
- `learning_id`
- `fingerprint`
- `component_scope` such as hook/narrative/emotion/CTA/timing/format
- `claim`
- `baseline_definition`
- `effect_metric`
- `effect_size`
- `sample_size`
- `confidence`
- `evidence_window`
- `status`: `CANDIDATE`, `TESTING`, `PROVEN`, `WEAKENING`, `RETIRED`
- `first_seen_at`
- `last_validated_at`
- `expires_or_review_at`
- `evidence_refs`

### `learning_applications`
Proves which learnings influenced a later post.

Required fields:
- `application_id`
- `post_id`
- `learning_id`
- `decision_id`
- `applied_at`
- `application_role`: `PRIMARY`, `SUPPORTING`, `EXPLORATION_CONTROL`
- `expected_effect`
- `actual_effect` nullable until evaluated
- `verification_status`

## Outcome ingestion contract
All external outcome payloads are normalized before persistence. The canonical event contains:
- event identity and idempotency key
- platform and external post identity
- observation timestamp
- metric payload
- source provenance
- data-quality flags

Duplicate deliveries must be idempotent. Conflicting payloads with the same event identity fail closed and create a material BRAIN error/recovery outcome rather than overwriting history.

## Evaluation windows
Each eligible post is evaluated at approximately 24, 48, and 72 hours after publication. The evaluator is idempotent: rerunning the same window produces the same evaluation identity and never duplicates learnings or applications.

A missing expected metric snapshot becomes an outcome obligation, not a silent zero. Zero is used only when the platform explicitly reports zero.

## Metric hierarchy
Optimization priority is fixed as:

1. realized revenue / orders
2. offers
3. qualified leads / meetings / DMs
4. substantive interactions
5. CTR / engagement
6. reach / likes

Lower-level metrics may explain performance but may not override contradictory higher-value outcomes.

`substantive_interaction` must be defined from available platform data as a weighted/qualified signal and must not equal raw like count.

## Comparison and normalization
The evaluator compares a post only against a relevant baseline cohort. Baseline dimensions include, where sufficient data exists:
- platform/account type
- personal vs company content
- content format
- funnel stage
- comparable post age
- comparable audience/content pillar

Rates are normalized by the best available denominator, normally impressions or reach. Absolute counts remain evidence but are not used alone when exposure differs materially.

The engine must expose the cohort size and baseline used for every derived learning.

## Learning rules
A learning is component-level, not a copywriting template. Examples of valid learning scope:
- `personal_experience + tension_hook + no_sales_cta`
- `proof_first + quantified_outcome + soft_dm_cta`
- `text_only personal post`

The engine may reuse mechanisms but never full previous copy.

Promotion lifecycle:
- `CANDIDATE`: one or more observations suggest an effect but evidence is weak.
- `TESTING`: intentionally being retested.
- `PROVEN`: minimum evidence threshold is satisfied and effect is directionally stable.
- `WEAKENING`: newer evidence materially reduces confidence/effect.
- `RETIRED`: no longer safe/useful for decisioning.

Initial conservative promotion rule for v1:
- `sample_size >= 5`
- at least two distinct publication dates
- normalized effect is directionally consistent
- `confidence >= 0.75`
- no contradictory higher-priority outcome signal

These thresholds are configuration, not hard-coded magic numbers, and can be tightened later from observed data.

## Exploration vs exploitation
Default decisioning target:
- 80% of eligible content uses one or more `PROVEN` learnings when contextually relevant.
- 20% is reserved for controlled exploration.

This is a target over a rolling window, not a requirement for every five posts. Exploration must state a hypothesis and must not violate brand, factual, legal, security, privacy, or evidence constraints.

## BRAIN projection
BRAIN must receive a bounded projection, not the raw metric warehouse. The projection contains the most relevant current learnings with:
- learning id
- concise claim
- context applicability
- effect metric/effect size
- sample size/confidence
- lifecycle status
- last validation date

Content-generation/selection code must read this projection before material content decisions. Every produced post records the IDs of learnings actually applied.

## Decision accountability
For each new post, persist:
- `decision_id`
- candidate learnings considered
- learnings applied
- exploration hypothesis, if any
- reason for rejecting otherwise relevant learnings

At 24/48/72 hours, applications are reconciled with actual outcome. This makes it possible to answer whether BRAIN is improving performance rather than merely storing advice.

## Scheduling/runtime
The v1 engine runs natively from repository-managed serverless/scheduled infrastructure. It must not depend on Make for:
- metric evaluation scheduling
- learning derivation
- learning lifecycle updates
- BRAIN projection generation
- application reconciliation

Make may temporarily forward external data where no direct connector exists, but the normalized event contract is identical whether data arrives through Make or directly.

## Failure and recovery
- No snapshot due by its evaluation deadline => `MISSED_OBLIGATION` and recovery attempt.
- Platform/API unavailable => retain obligation and retry under bounded backoff; never write zero as a substitute.
- Invalid/partial payload => quarantine event, record error, preserve raw provenance, do not contaminate learning model.
- Failed learning projection => keep last-known-good projection and open recovery obligation.
- Conflicting event identity => fail closed; no overwrite.
- Any automated change to canonical learning state writes a material BRAIN outcome.

## Security and privacy
- No platform credentials in repository or database rows.
- Use existing secret-management mechanisms only.
- Store only metrics and content metadata required for learning; avoid unnecessary personal data from commenters/DM participants.
- CRM outcome linkage uses internal identifiers; learning projections must not expose customer PII.

## Cost controls
- Prefer deterministic calculations over LLM calls for metric normalization, cohort selection, confidence and lifecycle transitions.
- AI may be used to classify content components when deterministic metadata is missing, but classifications are cached and auditable.
- Raw snapshots are stored once and reused across analyses.
- No polling frequency above what the 24/48/72 model requires unless a commercial outcome obligation needs it.

## Compatibility and migration
Migration is additive and reversible:

1. Deploy schema/storage and ingest contract while Make remains untouched.
2. Mirror outcome events from existing sources into the native ingest path.
3. Run evaluator/learning engine in shadow mode and compare outcomes with existing BG199/BG184/BG202 behavior.
4. Turn BRAIN projection consumption on for content decisions while Make still exists as fallback.
5. Verify real post -> metric -> learning -> applied-learning -> later-outcome round trip in production.
6. Remove BG199/BG184 from the critical path only after native obligations are proven green.
7. Keep compatibility adapters only where an external source still requires Make.

No destructive scenario deletion is part of this change.

## Repository boundaries
Preferred new native units:
- `netlify/functions/social-outcome-ingest.mjs` — HTTP normalization/ingress
- `netlify/functions/_social-learning-store.mjs` — persistence adapter
- `netlify/functions/_social-learning-model.mjs` — pure domain calculations
- `netlify/functions/social-learning-evaluate.mjs` — scheduled evaluation/reconciliation entrypoint
- `netlify/functions/social-learning-context.mjs` — bounded BRAIN projection endpoint
- `config/social-learning-engine.json` — thresholds, metric hierarchy, exploration target
- `brain/contracts/social-learning-event.schema.json` — event contract
- `tests/social-learning-*.test.mjs` — domain, ingress, idempotency, lifecycle and projection tests

Exact filenames may be adjusted during the implementation plan only when existing repository conventions require it; responsibilities and interfaces above remain invariant.

## Testing strategy
Required test classes:
- schema validation and invalid-payload rejection
- event idempotency and conflict detection
- snapshot append-only semantics
- 24/48/72 evaluation identity/idempotency
- normalization/cohort selection
- metric priority rule
- learning lifecycle promotion/demotion/retirement
- exploration target accounting
- learning application reconciliation
- bounded BRAIN projection
- no-learning-on-missing-data
- last-known-good behavior on projection failure
- migration/compatibility tests for existing BRAIN event contracts

Production completion requires an end-to-end canary proving:
`post identity -> outcome event -> snapshot -> evaluation -> learning/projection -> learning application -> later outcome verification`.

## Production gates
This subsystem is not `PRODUCTION_GREEN` until:
- unit/contract tests pass;
- BRAIN chat-learning preflight is `READY`;
- BRAIN delivery lane is registered and green;
- security/cost/schema gates pass;
- exact candidate identity is deployed;
- production readback proves the end-to-end canary;
- material outcome and prevention learning are written back to shared BRAIN context.

## Success criteria
The feature is successful when all of the following are demonstrably true:
1. A published post has stable identity and component metadata.
2. Real post metrics are stored as immutable observations.
3. 24/48/72 evaluations occur without Make in the critical path.
4. BRAIN receives evidence-bounded current learnings.
5. A new content decision records which learnings it used.
6. Later outcomes reconcile against those applied learnings.
7. A dashboard/query can answer which mechanisms are improving substantive interactions and commercial outcomes.
8. Pausing Make does not stop the native learning loop.
9. Failure creates a recoverable obligation instead of silent data loss.
10. The exact production version is verified through existing BRAIN delivery controls.
