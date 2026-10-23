# Atomic bounded revenue-learning action reconciliation — 2026-10-23

Issue: [#4445](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4445). Obligation: growth|revenue-learning|bounded-atomic-sales-action-reconcile|20261023-v1

## Independent observations
At 2026-10-23T13:00:53.081Z, production Netlify `revenue-learning-evaluate` returned HTTP 502 after a 503 timeout from the downstream Supabase `revenue-learning-store`. Supabase logs independently recorded POST 503 at 13:00:57.870Z. The currently deployed Edge reconciler repeatedly requests the oldest 50 executed actions, serially invokes the same 3-obligation RPC for each, and never advances to later rows; 340 executed actions are present.

## Contained repair
Within the **existing** revenue-learning Edge endpoint and existing hourly Netlify evaluator only, replace the 50 per-action HTTP RPCs with one service-role-only, atomic PostgreSQL batch. An advisory *transaction* lock enforces singleflight; the same three canonical outcome/economics/human feedback obligation rows serve as durable fair-progress receipts. Missing receipts rank first, then least recently reconciled, with deterministic tie-breaking. The cap is 16 per invocation and no second table, scheduler, queue, API token, agent, outcome record or simulated revenue is created.

The pre-existing per-action function decides real evidence statuses without inventing outcomes. If a provider call fails or the migration is missing, the store returns an error, and the evaluator cannot return a misleading 204. If concurrent execution holds the lock, a typed degraded 202 is rejected by the current Netlify client rather than counted as success. Results explicitly state **bounded batch coverage**, not whole-population proof.

## Controlled release
This candidate changes Supabase executable migration and existing Edge source. Keep it under the original Required, CodeQL and Supabase-preview gates. The database migration must be applied and authenticated service-only ACL verified *before* the dependent Edge function is published. Confirm Netlify evaluator compatibility, actual Edge version, and the production deployment source; run unauthorized RPC test, concurrent invocation, partial error/crash, 340-action fairness and repeat-hourly catch-up tests. Verify source counts, obligation status/readback and production 502/503 latency before changing promotion decisions.

Do not force merge, run an ad hoc production migration or claim that a single passing source test proves a stable production service. No customer-value acceptance is implied.
