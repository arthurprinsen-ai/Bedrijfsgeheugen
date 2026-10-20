# Development ledger — commercial outcome KPI truth, 2026-10-09

- Audit authority: 1,369 raw sales outcomes over 90 days, including 1,349 false derived converted operational rows identified and cleaned by protected #4279.
- Remaining invalid projection: existing full-cycle and growth Brain functions still presented raw 1,369 as `observed_sales_outcomes_90d` / `outcomes_90d`; opportunity touchpoints included no-send events.
- Candidate: exact existing two function definitions altered only around outcome counts/touchpoint eligibility. No new writer, scheduler, job, CRM, or revenue claim.
- Regression: tests/brain-commercial-outcome-kpi-truth-v1.test.mjs; Brain compiler failure_class FALSE_POSITIVE_OUTCOME and replay/shadow.
- Verification: protected GitHub merge + exact production SQL and independent readback of business counts while original 1,369 raw events remain preserved.

## Preview proof reconciliation
The first GitHub provider check for this PR recorded a Supabase branch replay failure `SQLSTATE 42P16 cannot drop columns from view` while the preview was being provisioned. The eventual Supabase provider dashboard explicitly marked configurations, migrations, seeding and edge functions successful, and independent preview database `supabase_migrations.schema_migrations` has `20261009193000 filter_real_commercial_outcome_kpis_v1` installed with the new KPI function source. A fresh exact-head provider check is still required; neither the old failed check nor database state alone authorizes a protected merge. Existing service-role-only EXECUTE grants have been preserved and enforced in the SQL migration.
