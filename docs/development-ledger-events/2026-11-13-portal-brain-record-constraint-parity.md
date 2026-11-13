# 2026-11-13 — P0 #4215 Portal/Brain record-type schema contract incident

- Canonical original GitHub issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Original ONE BRAIN fingerprint: `portal|businessinput|brain-record-type-kind-schema-rejected-original-four-stage-source-writes|20261113-v1`
- Source evidence: live Supabase `pg_get_constraintdef` CHECKs + live `brain_append_record` SQL via read-only connector and original Portal V2 handler `createPortalBusinessInputHandler`. No third-party source.
- Observed root cause: original typed Portal source records are not all allowed by original canonical Brain PostgreSQL CHECKs, despite mock-only test success.
- Scoped correction: add three exact original Portal type/kind pairs to both original Brain CHECKs with an atomic validation migration, no RLS/security or tenant change. Existing `agent-data-quality`, Portal Living Interface skill, learning and central Brain regression updated.
- Audit status: candidate only until Required, CodeQL, native provider application, exact schema readback, original BRAIN and downstream customer processed receipt. Parent P0 stays OPEN; cannot infer human customer outcome from tests.
- Original recovery/retry: same sourceRevision/tenant/idempotency, no new executor, new schedule, store or work queue. Check 0/null/false/[] and two-tenant authenticated readback only in a safe authorized test route.
