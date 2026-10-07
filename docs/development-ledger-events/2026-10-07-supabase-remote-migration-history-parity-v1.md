# 2026-10-07 — Supabase remote migration history parity

## Failure

After PR #4075 merged successfully, the production Supabase Git check failed with:

`Remote migration versions not found in local migrations directory.`

Readback identified exactly six remote-only versions:
- `20261007165737` — `personal_linkedin_dream_builder_human_language_v1`
- `20261007165811` — `personal_linkedin_closed_loop_policy_refresh_v1`
- `20261007165818` — `personal_linkedin_daily_experiment_copy_refresh_v1`
- `20261007165821` — `personal_linkedin_human_language_guard_v1`
- `20261007170121` — `instagram_personal_no_mira_scope_v1`
- `20261007171249` — `personal_linkedin_founder_journey_problem_sources_v1`

## Correction

The exact migration statements recorded in production history were read back and mirrored into the repository under the same version/name identities. The migration-history lock was refreshed from production. A regression now verifies captured remote history remains locally replayable.

The historical predictive founder materializer mirror is additionally hardened for fresh replay with explicit service-role-only EXECUTE authority. Production history itself is unchanged.

## Terminal acceptance

Exact-head Required + CodeQL + Supabase Preview must be green, protected merge must complete, and the resulting main commit must receive a successful production Supabase check with the new `20261007182000` migration present in production history.
