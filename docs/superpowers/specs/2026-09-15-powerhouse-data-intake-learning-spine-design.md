# Powerhouse Data Intake & Learning Spine Design

## Status
Approved for implementation by the user on 2026-09-15.

## Goal
Make all relevant internal and external growth, marketing, search, social, website, sales, market, competitor and outcome data a permanent part of the existing Bedrijfsgeheugen Powerhouse so that the system can measure, learn, calibrate and improve every day without creating a parallel data or learning platform.

## Canonical constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Supabase is canonical persistence.
- Existing Powerhouse event, outcome, forecast, calibration, social and learning tables remain authoritative.
- No Make dependency.
- No parallel CRM, analytics store, brain, queue, calendar or learning system.
- Every ingestion path is idempotent, evidence-bearing, freshness monitored and fail-closed.
- A source is only healthy when production readback proves recent accepted records, not merely when a job ran.
- External paid sources must be bounded by deterministic cost guards.
- Provider lag is respected: delayed sources such as Google Search Console are judged against their realistic freshness SLA, not wall-clock same-day completeness.

## Architecture

### 1. Canonical intake spine
All source adapters normalize observations into the existing `powerhouse_runtime_events` and, where they are growth/funnel events, the existing `growth_events` / `growth_outcomes` lineage. Source-specific high-dimensional details remain in JSON evidence/context unless the current schema already provides a dedicated table such as `social_metric_snapshots`.

Every normalized record must carry:
- deterministic dedupe key;
- source and channel;
- subject/content/topic/campaign/opportunity keys where known;
- observed/occurred timestamp;
- raw provider evidence or response metadata;
- data quality state;
- confidence;
- lineage identifiers sufficient to connect later outcomes and learnings.

### 2. Source registry and health
A canonical registry describes every source, cadence, freshness SLA, provider class, cost policy and downstream consumers. Health evidence is represented through the existing Powerhouse runtime/event lineage and a compact canonical source-health table only if no equivalent existing table is present.

Health is derived from:
- last successful collection timestamp;
- newest provider observation timestamp;
- accepted row/event count;
- rejection/error count;
- data-quality verdict;
- freshness SLA verdict;
- downstream learning-consumption evidence.

### 3. Source coverage
Initial Powerhouse source classes:
- Buffer / LinkedIn / Instagram social publication and performance;
- website first-party growth events;
- Google Analytics 4 aggregated traffic/conversion observations;
- Google Search Console organic query/page performance;
- SEO/SERP and DataForSEO bounded market intelligence;
- technical SEO / web performance where existing providers expose it;
- email/newsletter campaign and response outcomes;
- sales/outbound actions, leads, opportunities, won/lost outcomes and realized revenue;
- LinkedIn cockpit / relationship graph interactions;
- content/blog/article performance and publication outcomes;
- referrals, UTMs and campaign attribution;
- company, competitor, market and topical intelligence from approved public sources;
- pricing/positioning signals when evidence is attributable;
- forecast outcomes, calibration data and operational incidents/holds/failures.

### 4. Scheduling
Cadence is source-specific. Social remains more frequent where already implemented. Slow provider datasets run daily. Market/news/competitive collection runs at a bounded cadence appropriate to provider rate limits and cost. The canonical daily Powerhouse loop evaluates all source health and downstream freshness.

### 5. Closed-loop learning
Accepted observations are consumable by the existing learning, forecasting, calibration and revenue loops. The system must be able to connect:
`source observation -> content/topic/campaign/person/company -> action -> engagement/visit -> intent -> lead/opportunity -> order/revenue -> learning -> calibrated next decision`.

Operational failures also become evidence: missing credentials, provider errors, stale feeds, schema drift and quality failures are recorded through the existing error/learning lineage and must never silently degrade to success.

### 6. Security and privacy
- Secrets stay in provider/GitHub/Netlify/Supabase secret stores, never committed.
- Only minimum necessary provider scopes are used.
- Person-level data is ingested only when it already belongs to an approved first-party/customer/relationship workflow and is required for the Powerhouse purpose.
- Public intelligence is attributable to source and timestamp.
- Existing RLS/auth patterns are preserved; no blanket RLS changes are part of this feature.

### 7. Verification and release gate
A source may be marked `LIVE & BEWEZEN` only when all applicable evidence exists:
1. implementation merged to `main`;
2. deployment/workflow active in production;
3. source collection completes;
4. production Supabase contains accepted recent evidence;
5. dedupe/idempotency verified;
6. freshness verdict is green against source SLA;
7. downstream Powerhouse learning/readback consumes the source or explicitly records why no learning was produced;
8. regressions/tests and required checks are green.

If some providers lack credentials or upstream access, their adapters and health contracts may be deployed but their source status remains `GEBLOKKEERD` rather than being falsely reported healthy.

## Non-goals
- Building a second warehouse.
- Polling every external source indiscriminately.
- Scraping sources that disallow it.
- Creating fake analytics or placeholder records to satisfy health checks.
- Treating CI test success as production data-readback success.
