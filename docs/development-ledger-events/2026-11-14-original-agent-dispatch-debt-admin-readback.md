# 2026-11-14 | Original immutable agent dispatch visibility

- Root P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Native independent source: 3,312 `AgentWork/PENDING`; 1,055 `RecoveryWork/RECOVERING`; 14 original `INNOVATION_INTAKE/PLANNED` (not counted in immutable dispatch totals).
- Failure mode: no direct admin readback of original immutable agent and recovery work aggregate; fake-green risk from successful cron and assigned but unconsumed agent work.
- One existing admin-only Netlify route and original Portal V2 panel; two `Prefer: count=exact` bounded queries, no row IDs leave server. Fail closed for truncated/malformed/unavailable count source.
- Existing agent roster, original improvement skill, executable replay test updated. No customer sends, source mutations, extra cron, new producer/consumer, RLS change or duplicate store.
- Verification remains required: protected exact-head checks → merge → exact Netlify deploy SHA → authenticated admin source count readback → subsequent actual original agent consumer, source-bound independent receipt and measured outcome.
- Machine learning: `brain/learning/2026-11-14-original-immutable-agent-dispatch-debt-v1.json`. Human change: `docs/changes/2026-11-14-original-agent-dispatch-debt-admin-readback.md`.
