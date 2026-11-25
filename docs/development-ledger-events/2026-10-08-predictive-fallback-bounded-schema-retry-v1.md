# Development ledger: bounded predictive schema recovery

- Date: 2026-10-08
- Obligation: powerhouse-predictive-fallback-schema-retry-20261008-v1
- Root cause: otherwise approved external LLM can sometimes return invalid structured forecast JSON.
- Production observations: successful six-forecast fallback run 15:19:06 UTC; later FALLBACK_FORECAST_SCHEMA_INVALID at 15:19:21 UTC.
- Repair: exactly one schema-only retry in existing provider path. Do not relax evidence schema or privacy boundary; provider/auth errors remain terminal.
- Scope: supabase/functions/_shared/predictive-approved-fallback.mjs; supabase/functions/powerhouse-predictive-engine/index.ts; tests/brain-predictive-approved-fallback-v1.test.mjs; brain/learning/2026-10-08-predictive-fallback-bounded-schema-retry-v1.json; docs/changes/2026-10-08-predictive-fallback-bounded-schema-retry-v1.md; this ledger.
- Outcome at authoring: source candidate; protected merge and exact production provider evidence not yet established.
- No secret rotation, unsanctioned message, schema/RLS change, extra scheduler or fake AI/business outcome.
