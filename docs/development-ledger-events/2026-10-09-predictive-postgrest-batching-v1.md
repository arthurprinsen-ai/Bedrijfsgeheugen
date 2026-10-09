# Development ledger: predictive signal PostgREST timeout recovery

- Date: 2026-10-09.
- Obligation: p0-4198-predictive-postgrest-timeout-batching-20261009; parent P0 #4198.
- Source of truth: existing Supabase `powerhouse-predictive-engine` Edge function, database forecast and revenue learning obligations, approved Anthropic model; no new executor, schedule or provider.
- Actual failure: Edge HTTP 500, pg_net request 1684, PostgreSQL SQLSTATE 57014, log 14:28:11 UTC. PostgREST role `authenticator` has eight-second statement timeout. Database context identifies upsert of `powerhouse_predictive_signals` followed by forecast and calibration-obligation triggers writing `revenue_learning_obligations`.
- Distinct provider truth: Anthropic primary smoke HTTP 200, request 1686; does not prove successful predictive execution.
- Change: bounded sequential upsert in five-row chunks, original `signal_key` onConflict, original trigger cascade and existing error handling. No inflated timeouts, skipped commitments or fake success signals.
- Tests: static source invariant plus batch counts 0/1/4/5/6/50/80 and original approved provider and forecast evidence invariants.
- Closure: successful protected merge, production function source readback, authenticated runtime invocation, persisted forecasts/learning and provider-bound full commercial outcomes. The candidate is NOT production-proven until those checks pass.
