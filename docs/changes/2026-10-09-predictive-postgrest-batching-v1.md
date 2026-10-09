# Predictive signal persistence batching — P0 #4198

Date: 2026-10-09. Existing-state-first: Anthropic primary was independently confirmed HTTP 200 and is already routed through the approved model. The current engine still returned HTTP 500 from SQLSTATE 57014 on 9 October 14:28 UTC. Supabase PostgreSQL logs pinpoint PostgREST's single bulk `powerhouse_predictive_signals` upsert and nested `powerhouse_sync_predictive_signal_forecast` → `powerhouse_sync_forecast_calibration_obligation` trigger writing `revenue_learning_obligations`. The PostgREST authenticator has `statement_timeout=8s`.

The patch batches the existing upsert in sequential groups of five with the same conflict key. It does not relax timeouts, disable triggers, change model governance, duplicate the executor or bypass Brain/learning persistence. Existing forecasts and calibration obligations remain truth-carrying database side effects. Batching may extend the overall run but avoids the observed one-statement timeout; success is contingent on a real authenticated runtime regression and provider/data readbacks.

Validation: `tests/brain-predictive-postgrest-batching-v1.test.mjs`, existing predictor tests, protected checks, CI, production Edge deployment and real execution. Omnichannel full-cycle P0 #4198 stays open until all channel receipts, outcomes and Brain learning are proven.
