# 2026-11-03 — Restore the original Supabase production migration identities

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independent source evidence

At 2026-11-03 16:24 UTC, canonical Supabase production `supabase_migrations.schema_migrations` contained **794 applied version/name identities**. Canonical GitHub `supabase/migrations/` also had 794 filenames, but the sets were not equal:

- Production ALREADY APPLIED, missing in GitHub: `20261103141902_repair_experimentcyclus_regex_2201b_20261103` and `20261103142201_repair_experimentcyclus_required_started_at_23502_20261103`.
- GitHub merged PR #5373 contained NEW but NOT YET APPLIED: `20261103143000_bg_experimentcyclus_regex_started_at_contract_v1` and `20261103223001_one_brain_policy_promotion_failure_receipts_v1`.
- Native original Supabase production main check on merge `fded9060847ee6c392c6ae62f1550755089f9c12` FAILED: `Remote migration versions not found in local migrations directory.` Check ID `126048556477`.

## Narrow original source reconciliation

Mirror **only** the two existing production version/name identities into original GitHub's versioned migration directory. SQL statements are read from production `schema_migrations.statements` for these exact identities; their original dump ends with `end $function$` without explicit PL/pgSQL or outer SQL semicolons. The two source files normalize only those terminators and append the **independently read-back existing** execute ACL: anon=false, authenticated=false, service_role=true. No original body decision change, no schema_migrations table write, no unschedule, no quota or provider proxy, no privileged user expansion, no paid or external action. Newer source remains in main.

## Original release and final proof

Use protected original PR and existing Supabase Git integration, not direct production migration repair or second scheduler. Verify latest exact-head source and semantic guards, then full Required/BRAIN/CodeQL and the official native Supabase Preview. Once protected-merged, independently inspect production versions 20261103143000 and 20261103223001 and exact current pg_get_functiondef of `public.powerhouse_one_brain_reconcile_v1`, `public.powerhouse_runtime_mux_task_v1`, role EXECUTE and the **next natural** original runtime scheduler task receipt at UTC :13 / :43. Do not call live, green, resolved or recurrence-proof until all independent source+production evidence succeeds.

The historical SQL representation may differ in statement terminators from the original provider's raw migration ledger but preserves the effective function body and original rights. Only the original product/provider authority can validate production application.
