# Terminalizer: Supabase test-SQL is verifier-only

Canonical incident: `delivery|terminalizer|sql-regression-classified-as-runtime|20261022-v1`.
Protected Brain PR #4697 successfully deployed the observer, but terminalizer run 39833808183 incorrectly rejected `supabase/tests/brain_failure_observe_semantic_recovery_v1.sql` as a missing production runtime (`UNWIRED_NON_NETLIFY_RUNTIME_READBACK`).

**Root cause:** the existing single readback contract omitted `supabase/tests/` from `verifierOnlyPrefixes`.

**Fix:** add precisely that prefix, with automated regression. Real `supabase/migrations/**`, `supabase/functions/**`, `netlify/functions/**` and unknown runtime stay subject to all original fail-closed provider, deployment and migration readbacks. The terminalizer workflow is unchanged; no new scheduler, registry or fake status.

**Release rule:** candidate only until new exact-head Required/CodeQL and protected merge. Confirm terminalizer rerun and production migration/ACL/runtime evidence independently. Revenue snapshot cron #46 remains separately red.
