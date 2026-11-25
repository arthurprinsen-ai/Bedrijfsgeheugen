# Predictive fallback strict bounded schema retry — 8 October 2026

Obligation: powerhouse-predictive-fallback-schema-retry-20261008-v1.

## Existing state and incident
The approved Composio/Groq fallback for predictive AI already produced six validated forecasts at 15:19:06 UTC, then another call failed FALLBACK_FORECAST_SCHEMA_INVALID at 15:19:21. Anthropic remains out of prepaid credit, but existing canonical AI governance explicitly approves the separate fallback use case.

## In-place change
Inside the existing shared approved fallback module, run one additional provider request only after the first forecast fails strict schema validation. The corrective request sends only the same privacy-redacted public signals and never sends the rejected AI response. No model, approval, database, customer data, marketing or scheduler change. Preserve the original whitelist; malformed retry fails closed. Provider errors are never retried. Persist fallback_schema_retry_count in forecast and success health evidence. Bound outbound requests to two per failed-schema cycle.

## Proof required
Red/green schema retry regression; 15 predictive and security tests; canonical Brain learning and material closure gates. Production acceptance requires protected merge, exact Supabase function/source readback and one external result. Local success does not imply production or guaranteed successful predictions.
