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
