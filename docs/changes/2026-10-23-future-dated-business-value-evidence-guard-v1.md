# ONE Brain: business-value freshness fails closed — 23 October 2026

Owner: [genuine customer outcome acceptance #4358](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4358). Candidate: [PR #4755](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4755).

## Verified source defect
The current `freshnessWeight(observedAt, now)` clamps a negative age to zero. Future-dated alleged observations then receive full freshness and can out-rank actual measured results. The ranker also accepts out-of-range confidence as `value_known=true`. This is a false-confidence defect in the **existing** autonomous improvement engine, not evidence of a provider revenue incident.

## Minimal correction
Use the valid timestamp difference only for observations at or before the valid reference clock. Unknown, unparseable and future values stay unranked with `value_priority=null`. Require confidence in [0,1]. Preserve genuine positive outcomes and genuine negative losses in the ranking.

The original daily GitHub intelligence probe stays read-only. The existing Supabase hourly improvement authority and its Brain record writer remain unchanged. No extra agent, scheduler, datastore, connector, model activation or external action.

## Test and release
Regression: `node --test tests/brain-autonomous-improvement-runtime.test.mjs` exercises future high-value false positive, malformed timestamp, confidence outside range, invalid reference clock, historical legitimate gain and measured loss.

First delivery check showed `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE` due to missing Brain learning, activity ledger and human documentation. These are now part of the **same** candidate with no admission waiver.

This is **CANDIDATE_NOT_LIVE** until the exact current head passes Required and CodeQL, protected merge and independent main/source deployment readback. No actual increased customer revenue, shorter CI queues or model superiority is claimed by this code change alone.
