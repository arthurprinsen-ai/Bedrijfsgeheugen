# 2026-11-13: original SEO money page duplicate-day handoffs

Fingerprint: `seo|original-money-owner-cross-day-idempotency|20261113-v1`.

- Detection: Existing original Supabase recommendations show two unresolved Exact/Twinfield money-page suggestions per day on 11, 12, 13 Nov despite one provider keyword cache observed 9 Nov. Daily source producer #175→BRAIN #140→Heartbeat acknowledged current SHA separately but actual CRO status still NOT_EXECUTED.
- Cause: `seo-owner-update:<run_date>:<canonical>` is deterministic only within a day; no readback gate for still-open same canonical owner, old completed/rejected source or no-op `ignoreDuplicates` insert.
- Original owner correction: original resolver retains same canonical recommendation table, queries prior 45-day rows, suppresses pending or source-identical decisions, preserves immutable evidence, and counts actual inserted upsert receipt only.
- Safety: no second scheduler, writer, table, CMS producer, provider-call or credential; original executor active even with missing GA4/GSC.
- Test `tests/brain-seo-original-money-owner-cross-day-20261113.test.mjs` covers pending, terminal unchanged, newer provider and irrelevant source. Release state CANDIDATE, not live until protected Required/CodeQL and original Edge readback; organic lead and revenue outcomes remain OPEN.
