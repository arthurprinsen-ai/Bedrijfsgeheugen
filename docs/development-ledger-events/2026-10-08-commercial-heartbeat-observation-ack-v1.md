# Commercial heartbeat transport acknowledgement — 2026-10-08

- **Obligation:** commercial-heartbeat-observation-ack-20261008-v1
- **Source:** production SQL readback, provider-owned Netlify → Supabase Edge implementation, external scheduler regression gate.
- **Defect:** an honestly unproven commercial day invalidated the heartbeat durable receipt, causing the existing external runner to roll back measurement and retry.
- **Scope:** one additive SQL function-replacement migration, a regression test, learning and documentation. No duplicate publisher or scheduled owner.
- **Success contract:** scheduled five-minute heartbeat stores `state=observed`, `data_quality=VERIFIED`, daily commercial proof remains false and the Brain obligation OPEN until actual provider IDs. Malformed assurance and broken operational regression must still be rejected.
- **Delivery:** protected CI → official preview → merge → production migration → first natural scheduled run/readback. Never mark terminal on PR approval alone.

## Isolated preview checkpoint (2026-10-08 08:21 UTC)

- New billable ephemeral Supabase preview `niberlvoaavlilrxgqag` linked to the exact GitHub branch; no production side effects.
- The first explicitly triggered preview run `5aabddc986f24fd08f831e042c2844dc` failed while replaying historical `20260928121746_instagram_terminal_provider_side_effect_trigger_v1` with `schema_migrations_pkey` duplicate (SQLSTATE 23505). This occurred BEFORE the new heartbeat migration.
- Preview ledger readback has 568 historical records ending `20261005160410`. This is an upstream provider migration replay/admission issue, not proof of a broken new SQL function.
- New function replacement was independently compiled and rolled back on the production-compatible schema: output contract gate exists; `anon` cannot execute; `service_role` retains execute. No unprotected production modification was performed for this follow-up.
- One refreshed exact-HEAD provider-run attempt is required after branch association. Do not evade the official Supabase check, delete other live preview branches, or claim merged.
