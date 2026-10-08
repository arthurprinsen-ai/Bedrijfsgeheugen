# POWERHOUSE — approved predictive provider schema correction

Date: 2026-10-08. Obligation ID: `one-brain-predictive-schema-retry-20261008-v1`.

## Existing state

The existing `powerhouse-predictive-engine` has a governance-approved, privacy-sanitized Composio/Groq fallback when Anthropic billing, throttling or availability prevents execution. It has proven six forecasts on 8 October, but another provider response was rejected as `FALLBACK_FORECAST_SCHEMA_INVALID`. Keep this evidence truthful. Do not duplicate a Brain, scheduler, provider integration or datastore.

## Recovery

A new `generateValidatedForecastFallback` wraps the **existing** provider client and unchanged `parseForecastPlan`. It retries **only** schema-invalid successful provider responses once, with a stricter system prompt and identical previously sanitized public input. Provider failures, policy/governance rejections, missing secrets or an invalid second answer remain terminal failures. The shared module enforces the original whitelist of public evidence keys, numeric constraints, maximum six forecasts and no fabricated sources.

The existing `bg_gezondheid` success receipt includes `fallback_attempts`. No publication, email, DM, financial value, AI provider credential or cron configuration is changed.

## Proof obligations

The regression suite validates one attempt on valid schema, one bounded second attempt on invalid schema, terminal failure on repeated invalid responses, no extra request on transport errors, and no expansion of public-data disclosure. The GitHub protected merge and canonical Brain material closure remain authoritative. Mark production green only after exact Supabase Edge source readback plus a new live run with a provider acknowledgement; do not equate deployment or a cron HTTP request with successful forecast creation. Confirm no customer-specific information crossed providers.
