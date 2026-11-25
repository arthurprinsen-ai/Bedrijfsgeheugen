# Skill: Supplier Evidence Recovery (model-freshness v2)

## Trigger and ownership
The existing AI Model Intelligence workflow is the single scheduling owner. Execute daily, when a catalog change is proposed, or when the 14-day verification gate fails. Never create a second scheduler or bypass Required checks.

## Agent policy
1. Read the canonical 110-model catalog and its supplier claim ledger.
2. Classify evidence as CURRENT (0–9 d), EXPIRING (10–14 d), STALE (>14 d), or INVALID_DATE. Do not use a catalog edit timestamp as supplier proof.
3. Prioritize production/router-eligible records first, then age and supplier impact.
4. Use the generated `model-evidence-worklist.json` to retrieve official model-specific documents. Source HTTP 2xx means reachable, **not** that a claim has been verified.
5. Evaluate each claim independently: model identity, status, price, capabilities, deployment, and governance. Record the exact canonical supplier URL, observation time, observed value, and independently reviewable receipt. Reject provider-generic pages as model-specific proof.
6. Keep tenant data residency, contractual privacy/zero-retention, regional storage and inferencing UNKNOWN unless individually substantiated. Unverified models must never be auto-eligible.
7. Produce a PR with only independently supported changes; no bulk `verified_at` reset, no synthetic evidence, no optimistic lifecycle statuses.
8. Run the existing claim and freshness tests, Required, CodeQL, and deployment parity. Verify workflow inventory/System Map synchronization; preserve protected merge.
9. After merge, read back the catalog and provider releases. Close the incident only when the required contexts pass and the model audit has independent evidence.
10. If source unavailable, put the record in source-unavailable/review-required; keep the guard on, with a reason and next retry. Do not endlessly recreate duplicate PRs.

## Runtime proof and improvement loop
Log each run with model ID, agent and skill version/hash, supplied source, decision, test SHA, PR, merge SHA and release evidence. Group errors by root cause. Every 7 days, measure percentage of expiring evidence renewed **before** day 14, time-to-renewal, provider outage frequency, manual reviews and false approvals. Optimize scheduling and grouping based on proven improvement, not cosmetic green results.

## Boundaries
This skill defines an operational contract and is not a claim that a provider has been reverified or a production agent has loaded this new version.
