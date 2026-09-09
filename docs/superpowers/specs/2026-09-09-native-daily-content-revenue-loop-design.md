# Native Daily Content Revenue Loop — Design

## Goal

Publish exactly one new, production-verified blog article every calendar day without Make, and continuously improve future blogs and social posts using attributable traffic, lead, order and revenue outcomes.

## Success contract

1. GitHub Actions is the canonical scheduler and orchestration layer for daily blog publication.
2. Make is not required anywhere in the production path.
3. Exactly one new blog article may become the canonical daily publication for a Europe/Amsterdam calendar date.
4. A day counts as published only after production readback proves the canonical URL returns HTTP 200 and the expected canonical/article markers are live.
5. Re-runs are idempotent and must not publish a second daily article.
6. Missing candidates, failed validation, failed delivery or failed live readback must fail visibly; no silent success.
7. Existing BRAIN v2 candidate-PR delivery, release gates and production authority remain authoritative. No direct push to main from the publisher.
8. Every blog and supported social post has a stable content_id.
9. Growth events attach content_id, channel, source/medium/campaign context and event timestamp.
10. Learning prioritizes commercial outcomes in this order: realized revenue/order > qualified opportunity/lead > conversion/CTA > site visit/click > engagement > reach.
11. Revenue must not be double-counted across assisted touches. The model stores first-touch, last-touch and assisted-touch evidence separately.
12. New content selection/generation must consume a versioned learning context derived from historic performance and commercial outcomes.
13. Learning is updated on multiple horizons (T+1, T+3, T+7, T+30 and final commercial outcome when available).
14. The system preserves bounded exploration: default 80% exploit proven patterns / 20% explore new hypotheses, configurable in repo.
15. The growth loop may recommend or rank content, but publishing remains constrained by deterministic contracts, allowlists and production gates.

## Architecture

### 1. Daily publisher

A new GitHub Actions workflow runs every day and can also be dispatched manually. It calls a deterministic Node script that resolves the Europe/Amsterdam business date, checks the publication ledger and existing live/repo state, selects one eligible candidate, renders or seals it through the existing approved-blog path, and hands the candidate to BRAIN v2 delivery.

The workflow does not merge or push to main directly. It creates one writer candidate/PR using the same candidate-only contract already used by approved-central-blog.

### 2. Publication ledger

A repo-tracked JSON ledger stores one record per business date. The canonical key is YYYY-MM-DD in Europe/Amsterdam. A record contains date, content_id, slug, candidate PR/head SHA, merge SHA when known, live URL, publication state and timestamps.

States are: selected -> candidate -> merged -> live. Only live closes the day. The workflow is idempotent: once a date is live, subsequent runs exit successfully with NO_ACTION for that date. If a date is incomplete, the next run resumes/reconciles the same content_id rather than selecting a new candidate.

### 3. Candidate selection

The selector consumes eligible approved central blog candidates plus the latest growth learning context. Ranking combines commercial intent, topic opportunity, historical conversion/revenue evidence, freshness, cannibalization safeguards and exploration quota. Deterministic tie-breaking uses stable ids so repeated runs select the same candidate.

If no eligible candidate exists, the workflow fails with NO_ELIGIBLE_DAILY_BLOG rather than pretending publication succeeded.

### 4. Growth event model

The existing growth-event endpoint remains the ingestion surface. The normalized event schema is extended/standardized around:

- event_id
- occurred_at
- content_id
- content_type (blog|linkedin|social)
- channel
- source / medium / campaign
- event_type (impression|engagement|click|visit|cta|lead|qualified_lead|opportunity|order|revenue)
- value and currency where applicable
- anonymous journey/session/customer correlation ids when available
- metadata limited to allowlisted properties

PII is not required for the learning loop. Correlation identifiers are opaque and attribution-safe.

### 5. Attribution and commercial score

A deterministic aggregator produces per-content metrics and attribution evidence. Revenue/order is counted once in canonical commercial totals; first-touch, last-touch and assisted-touch receive separate credit fields. Rankings use normalized value signals rather than raw likes/views.

The default commercial weighting is versioned in config and can be changed without changing code. Revenue/order signals dominate. Sparse-data Bayesian smoothing/minimum-support guards prevent one lucky event from permanently dominating ranking.

### 6. Learning context

A daily learning job materializes a versioned JSON learning context consumed by both blog and social content generation/selection. It contains:

- top/bottom themes by qualified commercial outcome
- top/bottom hooks, CTAs, formats, funnel stages and target segments
- content/channel performance windows
- attributable revenue/order evidence
- failure diagnoses (high reach/low click, high click/low conversion, leads/no orders, etc.)
- exploit candidates
- exploration hypotheses
- confidence/support counts
- generated_at and source window

The learning artifact is evidence, not an autonomous permission to bypass content/release contracts.

### 7. Multi-horizon updates

Scheduled evaluation recomputes content performance at T+1, T+3, T+7 and T+30. Later order/revenue events update the same content_id record. This prevents early engagement from outweighing later commercial results.

### 8. Live readback and watchdog

After production authority merges/deploys the daily candidate, a readback workflow checks the exact canonical URL with cache-busting. It validates HTTP 200, canonical URL, content_id marker and expected article metadata. Only then is the ledger advanced to live.

A later daily watchdog checks whether the current Europe/Amsterdam date has a live ledger record. If not, it fails loudly and emits diagnostic evidence for the incomplete state. It never publishes a second candidate for the same date.

## Components

- `.github/workflows/daily-blog-publisher.yml` — schedule/manual entry, deterministic selection, candidate handoff.
- `.github/workflows/content-growth-learning.yml` — scheduled multi-horizon aggregation/materialization.
- `.github/workflows/daily-blog-live-watchdog.yml` — publication SLA/readback evidence.
- `tools/content-growth/daily-blog.mjs` — date/ledger/candidate resolution and idempotency.
- `tools/content-growth/aggregate.mjs` — event aggregation and attribution.
- `tools/content-growth/learning.mjs` — ranked learning context and exploit/explore choices.
- `tools/content-growth/live-readback.mjs` — exact live proof for one ledger item.
- `config/content-growth-policy.json` — weights, horizons, exploration ratio and thresholds.
- `data/content-publication-ledger.json` — date/content publication state.
- `data/content-growth-learning.json` — generated learning context (bounded, versioned artifact).
- tests under `tests/content-growth-*.test.mjs`.

Existing approved central blog, SEO order engine, growth endpoint, BRAIN delivery and production release contracts are reused rather than replaced.

## Error handling

- Missing secrets/data -> explicit failing code with diagnostic reason.
- No eligible candidate -> fail; do not manufacture a low-quality publication silently.
- Duplicate current-date candidate -> fail unless it matches the existing resumable ledger record.
- Contract/test failure -> candidate never reaches production.
- Merge/deploy incomplete -> ledger remains non-live; watchdog fails.
- Readback mismatch -> fail and preserve expected URL/SHA/content_id evidence.
- Learning data missing/low support -> fall back to policy defaults and exploration guard; never fabricate revenue evidence.

## Testing

TDD is mandatory. Tests cover Europe/Amsterdam date behavior, idempotency, exactly-one-per-date, resumable incomplete runs, deterministic ranking, exploration quota, commercial weighting, no revenue double counting, multi-touch evidence, sparse-data guards, learning-context generation, canonical live-readback checks, and workflow contract assertions.

Repository-wide SEO/order/growth and Required gates must remain green. Production is only claimed after exact live readback on the merged production SHA and canonical blog URL.

## Rollout

1. Add tests and deterministic content-growth modules.
2. Add policy + initial empty/baseline ledger/learning artifacts.
3. Add native daily publisher, learning and watchdog workflows.
4. Wire the publisher to the existing approved-central/BRAIN candidate path.
5. Run targeted tests, full relevant regression, PR gates and production promotion.
6. Verify the first current-date publication/readback or, if today's publication already exists, reconcile it into the ledger and prove the daily contract is live for subsequent schedules.
