# Durable provider runtime evidence

Provider proof for Supabase Edge Functions is now part of the canonical terminal evidence contract rather than remaining only in pull-request text.

For every changed `supabase/functions/<slug>/`, the terminal workflow parses the declared active provider version and runtime SHA-256, sends the structured array through the GitHub OIDC-authenticated control-plane endpoint, and requires the Supabase authority to validate, hash, persist and return it.

The evidence is stored in append-only `brain_delivery_evidence` and is bound to the exact obligation, candidate head and main SHA.

Malformed, duplicate, non-ACTIVE, missing-version or invalid-hash identities fail closed. `LIVE_BEWEZEN` requires durable readback with `provider_readback_verified=true`.
