# 2026-10-06 — Supabase Edge declared-function scope v1

Obligation-ID: supabase-edge-declared-scope-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: 44356fed0901ad6485c60b826d3c4131a0ae89f9

Observed:
- production provider deployment is declaration-scoped by Supabase;
- authority parity on config changes was directory-scoped;
- the two scopes could diverge and make terminal parity overbroad.

Repair:
- config.toml/_shared changes resolve to declared functions only;
- direct function changes require a matching config.toml declaration;
- read-only provider parity remains byte-for-byte;
- no additional production writer is introduced.
