# External provider recovery must remain visible after same-hour retries

Date: 2026-10-25. Canonical owner: existing `bg-externe-signalen` Edge Function. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Independently observed failure
At 09:49 UTC the canonical external-intelligence producer recorded 2 of 3 successful source topics. At 09:50 UTC request 12509 (real `net._http_response`, HTTP 200) processed the same three topics with 3 successes, zero failures, 27 returned real search results and one admitted source. The corrected articles were stored, but no corresponding 09:50 producer receipt existed because its dedupe key used the same UTC hour + topic-start as the prior partial run.

The canonical SQL owner `powerhouse_record_source_observation_v1` uses `ON CONFLICT (dedupe_key) DO NOTHING`. Hence a recovered execution had been silently hidden from canonical source-learning evidence, even though the HTTP result was verifiable. This is not a reason to erase the earlier failed observation.

## Targeted correction
Change the *run receipt* dedupe key to include the producer's full `observedAt` timestamp and topic selection start. Keep immutable source event IDs, source article URL upsert, provider fallback, Tavily quota limits, DataForSEO bounded retry, signed scheduler authorization, and all existing 44-topic rotation logic. No second scheduler or incident register.

## Acceptance
- Regression in the already-required `tests/brain-external-signal-quota-failover-20261019.test.mjs` tests two same-hour events and a repeated exact event.
- Exact-head Required and CodeQL, protected merge and confirmed Supabase Edge code revision.
- A future real completed run must create its own canonical `external-intelligence-producer` receipt, without reclassifying the historical failure as success.
- Sales conversions, paid orders, and full fifteen-day source coverage require separate independent outcomes and cannot be inferred from HTTP 200.
