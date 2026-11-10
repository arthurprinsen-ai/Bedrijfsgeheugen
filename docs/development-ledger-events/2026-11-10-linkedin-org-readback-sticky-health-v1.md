# Development ledger — 2026-11-10 provider permission readback persistence

- Obligation: `powerhouse|social-metrics|linkedin-org-analytics-permission-403|20261022-v1`.
- Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Original production project: `adhjwmvyoixzjtmiroln`.
- Provider source log: `log_RHJ0G5Il1Gxp`; two LinkedIn Marketing reads HTTP 401 and one org stats HTTP 403; `urn:li:organization:18234216` / `urn:li:share:7525815714499170304`.
- Original existing runtime event: `741d626d-65fb-4637-9452-e3fa943bb56e`, immutable dedupe and exact error evidence; LinkedIn health DEGRADED readback.
- P0 cause: rolling 24h errors could expire despite unresolved provider permission and fresh unrelated LinkedIn activity.
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5586
- Candidate source: `supabase/migrations/20261110160055_linkedin_org_readback_sticky_provider_health_v1.sql`; four original tests `tests/brain-provider-readback-sticky-health-20261110.test.mjs`; original `AGENTS.md` prevention.
- Read-only independent SQL preflight: current `provider_state=degraded,unresolved=1`; simulated T+2d `errors_24h=0,events_24h=0,provider_state=degraded`. No production schema mutation in this preflight.
- First original Required run #42846279013 failed `PR_MACHINE_METADATA_INVALID` (missing Obligation-ID, Delivery-Lane, Candidate-Type, Base-SHA). No tests or CI checks were overridden; this same PR metadata was corrected to original base `f06fe142c7c3dc73bf0991dade68b89458134f64`.
- Open: exact-head fresh Required/CodeQL; protected merge; official Supabase production migration/readback; original LinkedIn API permission restoration; next natural consumer/handoff; 179 historical social-learning obligations.
- Truth: source candidate only until independent production/checkout proves deployment. A CODEQL or source test pass alone does not prove provider authorization or a new publication. No added cron, sender or Brain.

- The original PR machine metadata was subsequently completed with EXACT six-file Change-Scope, Scope-Budget 6, immutable Base-SHA and Candidate-Type recovery. This non-behavioral ledger update triggers NEW exact-head CI rather than rerunning a stale opening-event payload. Every earlier failed admission remains historical.

- The next original admission failure was precisely `unclassified delivery path: tests/provider-readback-sticky-health-20261110.test.mjs`; source was NOT the cause. Moved the SAME four regression checks to the already classified original backend `tests/brain-` prefix, updated Brain/AGENTS/ledger refs and immutable six-file PR metadata. No relaxation of classification or guard. This append is the fresh-head natural synchronize trigger; prior failures remain intact.

- Original Supabase source contract initially failed closed because the new view SQL did not explicitly REVOKE browser-role privileges in the SAME migration. Independent production ACL confirms existing `anon=false`, `authenticated=false`, `service_role=true`; candidate migration now explicitly preserves this via `revoke all on table public.powerhouse_provider_health_v1 from public, anon, authenticated;` plus source regression, no new browser privileges. Original failed check remains historical, fresh exact-head checks required.

## Protected production release 16:02 UTC and migration identity reconciliation

- Exact-head PR #5586 `Required #42849751770` SUCCESS, `CodeQL #42849751985` SUCCESS, protected GitHub main `40400729db629699289ce6bf6d84d4aac3878db2` MERGED.
- Exact original merged SQL applied via canonical Supabase native migration; independent `supabase_migrations.schema_migrations` readback: `20261110160055_linkedin_org_readback_sticky_provider_health_v1`, 3834 SQL bytes, exact original source content.
- Live original `powerhouse_provider_health_v1` is `linkedin:degraded`, `unresolved_capability_readback_denials=1`, not fake success; `security_invoker=true`, `anon=false`, `authenticated=false`, `service_role=true`; no extra scheduler or send.
- Release gap: native provider assigned `20261110160055` while source-proposed filename was `20261110153331`; previous original provider-backed Git lock = 823, native complete actual ledger = 824. Source history and lock must be separately reconciled through protected PR; never patch production history or rerun applied SQL.
- New source alignment uses exact official version `20261110160055`, removes ONLY the *unapplied proposal version alias* and appends the provider-verified 824th original lock entry; all previous 823 identities compared byte-for-byte unchanged against independent provider query. A new fail-closed native provider-version regression and ONE BRAIN lesson document the original release friction.
- This follow-up remains SOURCE_CANDIDATE until Required+CodeQL and protected merge. Postmerge Git source/lock/production identity readback required; underlying LinkedIn org OAuth read permission and 179 social-learning obligations remain unresolved independently.

## Protected admission failure and original fail-closed recovery — 17:33 CET
- PR #5588 latest first Required run #42852791637 correctly rejected the proposed renaming of historical `20261110153331` file because the original protected migration gate refused a `D` status even though the SQL had already been deployed under canonical native Supabase version `20261110160055`. This is intentional immutability, not evidence of a corrupt database. Do not turn the guard off or create a shadow migration.
- Independently queried native `supabase_migrations.schema_migrations` for exact official `version=20261110160055`, `name=linkedin_org_readback_sticky_provider_health_v1`, `sha256=f22aa2e366cf32a5a6770fedf8b2c126129b0101a125dd3216f456114319f8e5`, `SQL bytes=3834`. Existing official applied count is 824; original provider-backed lock 823.
- Existing original protected source admission is now extended with ONE immutable-base-specific, original-SQL-sha256-specific, append-only 823→824, exact two-path D/A reconciliation. Ordinary migration deletion, modification, extra replacement, altered SQL, wrong release base, wrong project, bad provider metadata and nonmonotonic identities are rejected. Source-only CI tests independently verify negative cases; external hosted Preview remains required. The existing script is not bypassed.
- New original tests `tests/brain-verified-provider-health-native-reconciliation-20261110.test.mjs`, helper `tools/ci/verified-provider-health-native-version-reconciliation.mjs`, and the original ONE BRAIN learning contract include historical/shadow/canary evaluation. Scope and PR machine metadata updated, old failing Required run remains permanent evidence.
- Do not apply SQL again. Require exact-head Required/CodeQL, protected merge and independent source/provider 824 version+name parity before source-history closure. Org analytics OAuth remains unproven and unresolved separately.
