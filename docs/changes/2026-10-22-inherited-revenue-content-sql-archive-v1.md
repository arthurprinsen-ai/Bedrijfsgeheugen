# BRAIN inherited source references — revenue and social reconciliation SQL

Obligation: `ci-brain-archived-revenue-content-source-20261022`; existing parent [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742), independently blocked portal [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573).

## Evidence and diagnosis
The verified [full BRAIN run #39671036043](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043) still reports 321 failures. Two included test failures are ENOENT against historical SQL sources moved out of executable `supabase/migrations` into `supabase/migration-history/repository-only`.

- `tests/brain-one-million-revenue-operating-contract-v1.test.mjs` — the original SQL is archived at `supabase/migration-history/repository-only/20260929162000_powerhouse_one_million_revenue_operating_contract_v1.sql` (blob `f37aa930e2f2b89602a6878fc4714a88c5e46392`).
- `tests/brain-social-publish-atomic-claim-dedupe-v1.test.mjs` — archived `supabase/migration-history/repository-only/20260917235907_social_content_integrity_invalidation_guard.sql` (blob `c653d64b4724fb654f610effd2ce6422c17269e9`).

The change touches only those two test input paths, never SQL statements or production runtime. Existing assertions remain unchanged. A separate regression asserts both source pointers, no executable migration duplicates, one canonical commercial scheduler, function termination, and service-role-only execute permissions.

## Prevention and terminal verification
Use verified immutable archive sources for historical test contracts. Do **not** restore removed SQL into executable migrations, skip BRAIN, substitute mocks, disable security checks or declare partial fixes green. Keep the existing migration-history parity/clean-room replay obligation #3742 separate.

Run the three affected tests, canonical learning replay/shadow/canary, exact-head Required CI, CodeQL and **full** BRAIN. The candidate cannot merge on a partial pass. The portal's actual authenticated A/B tenant acceptance #4215 and Supabase/Netlify production readbacks are unchanged and still required for their respective closures.

Current status: **source-backed candidate only**. The reduction by two failures is a hypothesis until a new complete run confirms it; production, database schema and scheduler remain unchanged.
