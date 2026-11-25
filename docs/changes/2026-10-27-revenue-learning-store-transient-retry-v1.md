# Revenue learning: one safe retry after a cold-start store timeout

The first hourly `revenue-learning-evaluate` attempt of 14:00 UTC failed with a 503 from the store edge function ('TimeoutError: Signal timed out', the 2.5 s database bound on a cold start). The gateway now retries once after 400 ms on a 5xx or network failure. All actions are reads or idempotent writes, so a retry cannot duplicate data; 4xx responses and degraded 202 payloads are never retried.

## Validation

`node --test tests/brain-revenue-learning-store-transient-retry-20261027.test.mjs tests/revenue-learning-store.test.mjs tests/revenue-learning-evaluate.test.mjs tests/revenue-learning-project.test.mjs` (28 of 28 pass locally)

## Boundaries

The edge function is unchanged; no redeploy is needed. A store that stays slow still fails the run visibly after one retry.
