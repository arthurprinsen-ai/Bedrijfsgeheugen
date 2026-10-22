# BRAIN LinkedIn pre-action forecast: historical SQL source recovery

- Obligation: `ci-brain-linkedin-preaction-forecast-retired-sql-oracle-20261022`
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
- Original evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39755490943/job/119746782219
- Root cause: historical regression reads `supabase/migrations/20260915125800_powerhouse_linkedin_sales_prediction_activation_v1.sql` after the already-applied SQL was removed from the executable migration directory.
- Exact retained source: `supabase/migration-history/repository-only/20260915125800_powerhouse_linkedin_sales_prediction_activation_v1.sql`, blob `8daf835dc5ff3f79fc11c7c4505755b436ed9522`.
- Fix: replace only the historical source read path, retain original four positive assertions and two negative commercial/privacy guards; add `tests/brain-linkedin-forecast-retired-source-guard-20261022.test.mjs`.
- Prevention: never resurrect already-applied migrations as executable SQL, never weaken pre-action forecast/outreach controls, require immutable archive proof and fail-closed test.
- No production, RLS, auth, customer data, connector, scheduler or provider changes.
- Terminal acceptance remains **OPEN** pending exact-head Required, CodeQL, full BRAIN zero failures and independent clean-room parity/tenant gates.
- Fingerprint: `powerhouse|brain|linkedin-preaction-forecast-retired-sql-oracle|20261022-v1`.
