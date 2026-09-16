# Autonomous Improvement Runtime v1 — Delivery Plan

Fingerprint: `powerhouse-autonomous-improvement-runtime-v1`
Spec: `docs/superpowers/specs/2026-09-16-autonomous-improvement-runtime-v1-design.md`

## Goal
Turn the existing Continuous Improvement Engine into a periodic, deterministic, evidence-driven production loop without introducing any parallel persistent authority.

## Canonical architecture
- GitHub: source, review, protected release and read-only contract probe.
- Supabase/Brain: runtime/evidence/outcome/learning authority.
- Supabase `pg_cron`: existing production scheduler authority.
- `public.brain_append_record` -> existing `public.brain_records`: canonical improvement writeback.
- Notion: human-readable projection only.
- Parent candidate/evaluation contract: `powerhouse-continuous-improvement-engine-v1`.

## Delivery status
- [x] Pure runtime helpers for fitness, capability projection, champion/challenger, causal evidence, replay, safe chaos, simplification and business-value priority.
- [x] Deterministic hourly run identity and fail-closed validation.
- [x] Backlog intake using existing Continuous Improvement classification authority.
- [x] GitHub `Business OS Intelligence` read-only probe and focused contract tests.
- [x] Required CI integration without weakening existing V18/release controls.
- [x] Canonical production adapter `public.powerhouse_autonomous_improvement_cycle_v1` added as a source-controlled Supabase migration.
- [x] Production adapter reads existing failure, blocker, runtime, cost, verified-value and revenue signals; no new table/store.
- [x] Production writeback routes through existing `public.brain_append_record` for tenant `canonical`.
- [x] Existing Supabase security contract hardened with explicit EXECUTE revocation from `public`, `anon`, `authenticated`; service-role only.
- [x] Production contract test proves no `CREATE TABLE`, deterministic identity, safe non-destructive behavior and canonical scheduler/writeback reuse.
- [ ] Final exact-head protected CI terminal green.
- [ ] Protected merge to `main` with exact-main readback.
- [ ] Apply the source-controlled migration through the canonical Supabase migration path.
- [ ] Prove active `pg_cron` job `powerhouse-autonomous-improvement-cycle-v1` at `42 * * * *`.
- [ ] Invoke one live production cycle and read back the corresponding canonical `brain_records` packet.
- [ ] Invoke the same hourly cycle a second time and prove idempotency (one deterministic record identity).
- [ ] Update the existing human-readable Powerhouse documentation/learning lineage with production evidence.
- [ ] Close/supersede stale PR #1775 only after replacement #1783 is proven live.

## Hard gates
- Security, correctness and tenant isolation cannot regress.
- Unknown critical evidence fails closed.
- No aggregate magic score may decide promotion.
- Causality is never inferred from correlation alone.
- Destructive simplification is disabled.
- Production writeback must use observed evidence and existing canonical authority.
- No merge before exact-head protected checks are terminal green.
- No `LIVE & BEWEZEN` claim before exact-main plus production writeback/readback/idempotency evidence.
