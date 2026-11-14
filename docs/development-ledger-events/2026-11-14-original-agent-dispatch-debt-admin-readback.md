# 2026-11-14 | Original immutable agent dispatch visibility

- Root P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Native independent source: 3,312 `AgentWork/PENDING`; 1,055 `RecoveryWork/RECOVERING`; 14 original `INNOVATION_INTAKE/PLANNED` (not counted in immutable dispatch totals).
- Failure mode: no direct admin readback of original immutable agent and recovery work aggregate; fake-green risk from successful cron and assigned but unconsumed agent work.
- One existing admin-only Netlify route and original Portal V2 panel; two `Prefer: count=exact` bounded queries, no row IDs leave server. Fail closed for truncated/malformed/unavailable count source.
- Existing agent roster, original improvement skill, executable replay test updated. No customer sends, source mutations, extra cron, new producer/consumer, RLS change or duplicate store.
- Verification remains required: protected exact-head checks → merge → exact Netlify deploy SHA → authenticated admin source count readback → subsequent actual original agent consumer, source-bound independent receipt and measured outcome.
- Machine learning: `brain/learning/2026-11-14-original-immutable-agent-dispatch-debt-v1.json`. Human change: `docs/changes/2026-11-14-original-agent-dispatch-debt-admin-readback.md`.

## Protected admission recovery — no source migration re-executed
- Required initial run #43643998210 failed generated System Map integrity following agent roster change; its native generator reported exact contentHash `77184ae17f98960f4d07b2973ee1b906357946f99fcd8237de014698043e8878`. The existing canonical System Map and Portal script stamp were updated to **that exact native output**, without weakening the integrity check.
- The next Required run #43644161054 exposed a concurrent protected main migration #865 present as executable SQL but absent from the tracked source lock (864); independent *native production* `supabase_migrations.schema_migrations` now contains `20261115001500/original_public_email_overdue_source_replay_dispatch_v1`, total **865**, verified 2026-11-14 21:43:36.118904Z. Appended just this exact provider-applied identity to existing `supabase/migration-history.lock.json` with updated provider capture timestamp. No SQL migration or data change was executed by this repair.
- Final Required, CodeQL, Netlify and production admin role-gated independent readback still required; prior failed tests must not be labelled green.

## Exact-head original integration fixture correction
- After native provider SQL lock + original System Map parity, protected Required #43644515159 correctly refused **two old original Portal readback fixture files**: `tests/brain-powerhouse-existing-systems-portal-readback-20261029.test.mjs` and `tests/brain-powerhouse-preview-evidence-cockpit-20261029.test.mjs`.
- Source projection now has 14 exact provider reads, including two new count-only immutable original dispatch reads; stale fixtures hard-coded 12/12 or 11/12 and omitted both sources. Corrected old fixture **to actually include** `agentWorkPending` + `recoveryWorkActive` and native header `Content-Range` for the mock; restored 14/14 complete, 13/14 missing original terminal, per count identity 3313/1055, no `idempotency_key` selected. Preview red/amber controls remain fail-closed. No default source read-state softened and no unsupported real consumer ACK invented.
- Original protected 13-file scope, same parent P0. Required/CodeQL/Netlify on final exact candidate head must be repeated; no state or side effect patched in Supabase.
