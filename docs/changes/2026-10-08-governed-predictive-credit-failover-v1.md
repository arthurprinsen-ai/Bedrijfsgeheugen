# ONE BRAIN — governed predictive provider credit failover

**Obligation-ID:** `powerhouse-governed-predictive-credit-failover-20261008-v1`
**Scope:** existing `powerhouse-predictive-engine`, existing `brain_ai_governance_registry`, existing `bg_geheim`, existing Composio/Groq proxy; no new Heartbeat, Brain or cron.

## Live problem and existing-state-first resolution

After protected PR #4177 merged and the Supabase Edge production authority attested release, the genuine exception was preserved. The live health row on 2026-10-08 at 15:00:35 UTC reads `AI_400:Your credit balance is too low to access the Anthropic API`. The scheduler alone had already reported success, with no same-day successful predictive execution. The fallback model `openai/gpt-oss-120b` via Composio/Groq is **already approved and ACTIVE** for `supabase-powerhouse-predictive-first-mover-fallback-v1`, and earlier production runs on October 7 recorded successful provider provenance.

The previous predictive function was hard-wired to Anthropic. It could not select the existing approved fallback when Anthropic rejected credit, even though the commercial message composer uses the already integrated Composio/Groq adapter.

## Bounded and governed repair

- Keep canonical scheduler authentication, Anthropic governance, data sourcing, evidence-key validation, forecast persistence and score computation unchanged.
- The primary provider remains Anthropic. Reconsider only missing primary key, credit exhaustion, rate limit, timeout and upstream provider outages — **not** rejected governance, unauthorized requests or malformed forecast output.
- Before secondary invocation, query the separate, existing canonical governance record. Require `approved=true`, `lifecycle_status=ACTIVE`, `provider=Composio/Groq`, `model_id=openai/gpt-oss-120b`. Treat any missing/inactive/wrong model as a hard failure.
- Retrieve Composio credential through existing `bg_geheim` only inside the authenticated Edge Function. Call exactly one existing proxy request with a bounded timeout; never log or expose secrets.
- Require valid forecast JSON with no more than six forecasts. Reuse the existing independent source-key, confidence, probability and first-mover validation before writing any forecast. A provider outage or invalid response is not a successful prediction.
- Record effective provider, approved model, fallback indication and sanitized primary failure in the existing `bg_gezondheid` success receipt and response. A success receipt write failure is a real error, not silent success.

## Test and acceptance boundaries

Run `node --test tests/brain-predictive-governed-fallback-v1.test.mjs tests/brain-predictive-production-lineage.test.mjs`. The tests cover success with no secondary spending; governance denial; credit exhaustion and single fallback; unrecoverable security failures; secondary errors; bounded parsing; unchanged source scheduler contract.

This change does **not** claim Anthropic account funding or external marketing delivery. Completion requires protected merge, exact Supabase Edge provider-source-parity attestation and one safely authorized runtime readback of a real outcome (or a truthful failure receipt).
