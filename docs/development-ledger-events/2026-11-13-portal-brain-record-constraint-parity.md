# 2026-11-13 — P0 #4215 Portal/Brain record-type schema contract incident

- Canonical original GitHub issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Original ONE BRAIN fingerprint: `portal|businessinput|brain-record-type-kind-schema-rejected-original-four-stage-source-writes|20261113-v1`
- Source evidence: live Supabase `pg_get_constraintdef` CHECKs + live `brain_append_record` SQL via read-only connector and original Portal V2 handler `createPortalBusinessInputHandler`. No third-party source.
- Observed root cause: original typed Portal source records are not all allowed by original canonical Brain PostgreSQL CHECKs, despite mock-only test success.
- Scoped correction: add three exact original Portal type/kind pairs to both original Brain CHECKs with an atomic validation migration, no RLS/security or tenant change. Existing `agent-data-quality`, Portal Living Interface skill, learning and central Brain regression updated.
- Audit status: candidate only until Required, CodeQL, native provider application, exact schema readback, original BRAIN and downstream customer processed receipt. Parent P0 stays OPEN; cannot infer human customer outcome from tests.
- Original recovery/retry: same sourceRevision/tenant/idempotency, no new executor, new schedule, store or work queue. Check 0/null/false/[] and two-tenant authenticated readback only in a safe authorized test route.

## Actual original protected release and provider reconciliation
- **Merge:** PR #5707 protected main `7dc802b83577ac55a3399ce5a6967e9ac2dfc0a1`; CodeQL+Required SUCCESS after one native Supabase Preview branch rebase of branch `350e3f9e-77b8-4bdf-ac31-cd831a47b8d8`. The first preview failure `schema_migrations_pkey` old `20261005123347` was not masked.
- **Provider:** Supabase project `adhjwmvyoixzjtmiroln` migration `20261113060000 / portal_brain_record_contract_parity_v1` applied and independently read back; 839/839 distinct versions, RLS enabled, exact type/kind constraints verified. Observed `2026-11-13T06:37:59.338503Z`.
- **One original provider source-lock:** append that applied version/name only, maintain 838 existing identities unmodified, stamp real observed timestamp. BRAIN learning file changed from FIX_CANDIDATE to PROVEN_SCHEMA_ONLY, never customer/Heartbeat/CRO green.
- **No full-loop claim:** authenticated non-synthetic tenant source readback and ONE BRAIN processing/Powerhouse/Heartbeat/outcome/learning remain unproven; existing P0 #4215 and original red recovery owners retain obligations.
