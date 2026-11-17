# Original innovation evidence reconciliation — 2026-11-17

- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Source: canonical original `public.powerhouse_optimization_candidate_v1`, `public.brain_operations`, `public.brain_obligations`, historical `public.powerhouse_quality_events`.
- Counts at discovery: fourteen PLANNED, fourteen OPEN; nine generic quality-followups with nine exact first-party quality events; one original CRO measurement plan; four concrete engineering proposals, one original published-release receipt and one original no-change review.
- Failure class: QUALITY_EVENT_HAS_REAL_SOURCE_BUT_ORIGINAL_INNOVATION_OWNER_NO_CURRENT_EVALUATION_HANDOFF.
- Cause: original engineering code selector only accepts concrete source changes; generic quality follow-ups were not reconciled with their own first-party event and proof state, causing silent starvation.
- Fix: same native daily job consumes exactly matching nine quality records, records fourteen original source-bound nonterminal evaluation envelopes with operation CAS and independent readback.
- Historical quality `verified` is NEVER promoted into innovation provider/consumer truth. Never copy raw quality or customer data to workflow artifacts.
- CI: `tests/brain-innovation-original-evidence-reconciliation-20261117.test.mjs` under protected automation; existing original owner tests and CodeQL remain mandatory.
- Rollback: protected revert; never erase original operations or replace owner/service role.
- Verification still due: protected PR merge, exact Netlify code deploy, first natural or recovery run, 14 original CAS readbacks, measured effects and eventual independently verified consumer acknowledgements.

## Incidental protected migration-lock drift found on branch update

- Protected current main `4d29c3a407b2c9180615292996fee68e817b1086` introduced already-executable migration `20261117094500_original_result_guardian_existing_watchdog_v1.sql`, while its repository `supabase/migration-history.lock.json` still reflected the previous 875 migrations, making the whole Required admission suite fail (875 !== 876). The new innovation files do **not** alter SQL or migration contents.
- Independently queried canonical Supabase project `adhjwmvyoixzjtmiroln` on 2026-11-17 09:13:37 UTC: exact original provider history has **876** applied entries; the existing 875 locked entries match the provider exactly, and **exactly one** provider-only entry exists: version `20261117094500`, name `original_result_guardian_existing_watchdog_v1`.
- Corrective action: add this one already-applied identity to the original immutable lock and advance `captured_at` to the actual provider read timestamp. This is *not* a migration execution, applied-marker fabrication, change to historical SQL or weakening of required tests. If protected GitHub policy rejects lock-only recovery, keep the PR unmerged and use its original approved release repair route.
- Regression: existing `tests/supabase-migration-history-integrity.test.mjs`, `tests/brain-supabase-migration-lock-provider-20261029.test.mjs`, and the original protected required migration parity gate.
