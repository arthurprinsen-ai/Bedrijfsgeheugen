# POWERHOUSE approved predictive fallback — 8 October 2026

**Obligation:** `one-brain-predictive-approved-fallback-20261008-v1`.
**Owner:** existing Supabase Brain predictive engine; **no new Heartbeat, provider registry or scheduler**.

## Production incident and root cause

The error-receipt fix from protected PR #4177 was deployed as Supabase Edge version 125, and the exact-source production readback succeeded. A controlled authorized predictive rerun (pg_net request #984) returned HTTP 500 with `AI_400:Your credit balance is too low to access the Anthropic API`. The original error was correctly stored in `bg_gezondheid` rather than masked. A working cron trigger therefore did not imply a successfully completed predictive cycle.

The existing Brain AI governance registry already contained a separate active, approved `supabase-powerhouse-predictive-first-mover-fallback-v1` model, `Composio/Groq` / `openai/gpt-oss-120b`. Its permitted data classes include public news, content context and commercial analytics, explicitly excluding secrets, raw private payloads, raw DM bodies and personal contact information. A Composio credential is configured in the existing Vault. The engine did not use this pre-existing fallback.

## Structural repair

1. Keep primary `Anthropic` on the canonical `supabase-powerhouse-predictive-first-mover-v1` use case, with the existing approval and 45-second timeout.
2. Only on explicitly eligible primary failures (credit exhaustion, rate limit, 5xx or missing credential) read the **separate** fallback use-case record; require `approved=true`, `lifecycle_status=ACTIVE`, exact provider `Composio/Groq` and a model ID.
3. Whitelist public `external_news` and `search_demand` signal fields; exclude existing forecasts, raw contacts, learning payloads, secret fields, DMs and other private material. Redact email and phone patterns in allowed public summaries.
4. Reuse `COMPOSIO_SEARCH_GROQ_CHAT` through the existing Composio API and Vault credential; accept only one valid `forecasts` JSON object with approved signal references and bounded scores/horizon. The existing unique-source, probability, confidence and first-mover scoring gates **still** apply; no automatic publication or outbound commercial communication is authorized.
5. Persist the actual generation provider/model and a non-sensitive fallback reason with the forecast and same-day `bg_gezondheid` success receipt. If both providers fail, preserve the error and an `fout` receipt, not a fictitious prediction.

## Verification and boundaries

New red→green Node tests cover eligible and forbidden failovers, sanitized public data, schema and evidence-key validation, existing Composio transport and exact Brain governance wiring. Existing predictive migration/auth and error-receipt regression remain intact.

No switch to an unapproved model, no new credential, no cross-tenant private context, no schema migration and no weakening of protected merge. **LIVE_BEWEZEN** requires GitHub merge, Supabase Edge provider-source readback, an authorized rerun and recorded outcome. Provider/API cost is not assumed zero; existing billing remains authoritative.
