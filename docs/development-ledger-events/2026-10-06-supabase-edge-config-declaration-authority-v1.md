# 2026-10-06 — Supabase Edge config declaration authority v1

Obligation-ID: supabase-edge-config-declaration-authority-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: e6e676c670127b7378143688b684f6ef8ba6294f

Observed failure: Supabase production attestation was green while `social-recovery-runner` provider source remained stale. Root cause was an undeclared Edge Function outside GitHub Integration production deployment scope.

Structural repair:
- declare `powerhouse-social-publisher` and `social-recovery-runner` in `supabase/config.toml`;
- reject any selected production Edge Function missing from that config;
- resolve config/shared changes to declared functions only;
- lock the invariant in runtime-authority regression tests.

No direct provider or CLI production write is introduced.
