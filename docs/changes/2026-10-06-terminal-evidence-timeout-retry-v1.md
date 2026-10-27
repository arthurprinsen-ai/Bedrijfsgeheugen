# Durable terminal evidence recovery — 2026-10-06

A terminal-closure request can fail **after** Supabase has already durably committed the terminal state. Two failure signatures were reproduced on the same obligation:

1. the first HTTP request returned a timeout after the database had already committed `FULFILLED / VERIFIED / GREEN`;
2. a later rerun selected `canonical_run` instead of the original `descendant_live`, so the old implementation attempted a new operation write and hit `IDEMPOTENCY_PAYLOAD_CONFLICT`.

The endpoint now treats already committed terminal state as the authority. After valid GitHub OIDC, only the exact timeout/idempotency-conflict classes may enter a bounded readback fallback. That fallback reads the existing control-plane cockpit and requires the same obligation, `FULFILLED`, `VERIFIED`, non-red evidence, verified outcome, and the exact production main SHA.

Provider-sensitive terminalization does **not** use this fallback; it remains fail-closed. Migration and skill-projection conditions also remain required. The workflow keeps one bounded timeout retry as outer resilience.

This removes false-negative terminal closures without weakening exact-head, production, migration, provider, or durable-readback guarantees.
