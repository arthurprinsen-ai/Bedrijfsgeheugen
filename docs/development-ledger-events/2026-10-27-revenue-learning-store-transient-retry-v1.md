# Revenue learning store gateway transient retry

- Obligation: revenue-learning-store-transient-retry-20261027
- Change: one bounded retry in the Netlify gateway for 5xx or network failures; 4xx and degraded payloads are not retried. No new scheduler, writer or production DDL.
- Evidence: `tests/brain-revenue-learning-store-transient-retry-20261027.test.mjs`; Netlify observability 2026-10-27 14:00:51 UTC: revenue-learning-evaluate 503 after 4.7 s with 'Revenue learning store TimeoutError: Signal timed out. (503)', retry 14:00:56 UTC 204 in 8.8 s. The earlier HTTP 499 abort is gone after #4972.
- Status: candidate only; protected merge and a cold-start hourly run without 503 pending.
