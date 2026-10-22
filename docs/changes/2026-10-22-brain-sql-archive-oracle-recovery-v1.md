# BRAIN SQL archive oracle recovery — 2026-10-22

Obligation: `ci-brain-inherited-sql-archive-oracle-batch-20261022`. Related #3742, #4215 and blocked PR #4573. Base SHA: `1ba81ffa48c605ac1c99a4502955f7db0d416040`.

[Full BRAIN run 39671036043](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043) shows 3,511 tests, 3,190 pass, **321 fail**. Nine historical read-only source-oracle tests still refer to paths deleted from executable `supabase/migrations`; the corresponding nonempty immutable SQL archive sources have been read and verified. The exact single path literal per test now points to `supabase/migration-history/repository-only`. Existing positive, negative, tenant, security and behavior assertions remain untouched.

## Changed source-oracle tests
- `tests/brain-autonomous-improvement-currentstate-record-type.test.mjs` → `supabase/migration-history/repository-only/20260916182000_autonomous_improvement_currentstate_record_type_fix_v1.sql`
- `tests/brain-growth-swarm-bounded-refresh-v1.test.mjs` → `supabase/migration-history/repository-only/20260929165000_growth_swarm_bounded_refresh_v1.sql`
- `tests/brain-human-commercial-message-os-v1.test.mjs` → `supabase/migration-history/repository-only/20261005122000_powerhouse_human_commercial_message_os_v1.sql`
- `tests/brain-human-commercial-persuasion-runtime-v1.test.mjs` → `supabase/migration-history/repository-only/20261005123000_powerhouse_human_commercial_persuasion_runtime_v1.sql`
- `tests/brain-instagram-canonical-mira-identity-v1.test.mjs` → `supabase/migration-history/repository-only/20260929173500_instagram_canonical_mira_identity_guard_v1.sql`
- `tests/brain-instagram-meta-oauth-onboarding.test.mjs` → `supabase/migration-history/repository-only/20260921152000_instagram_meta_oauth_onboarding_v1.sql`
- `tests/brain-instagram-mira-reel-seed-normalization-v1.test.mjs` → `supabase/migration-history/repository-only/20260922082500_instagram_mira_reel_recommendation_normalization_v1.sql`
- `tests/supabase-tenant-identity-review-semantics-v2.test.mjs` → `supabase/migration-history/repository-only/20260918105000_tenant_identity_review_semantics_v2.sql`
- `tests/supabase-trigger-based-mkb-acquisition-runtime-v1.test.mjs` → `supabase/migration-history/repository-only/20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql`

The new source guard verifies archive existence/nonempty, original test import and no duplicate executable migration. **This does not repair Supabase remote/local migration parity** or alter runtime. It is not evidence of a complete 321→0 result. Candidate remains draft/fail-closed until exact-head full BRAIN + Required CI + CodeQL pass, supported #3742 clean-room migration parity and separate #4215 authenticated two-real-tenant customer readbacks. No code, RLS, ACL, scheduler, migration or production side effect.
