# Protected migration lock: 808th provider identity reconciliation (5 Nov 2026)

## Independent root cause and provider evidence
The original GitHub Required preflight for the **website buyer/lead-receipt PR #5458** failed after synchronizing current `main`: the recently merged, already **applied** source file `supabase/migrations/20261105134200_original_data_spine_decision_receipt_same_tick_v1.sql` was present in GitHub but absent from `supabase/migration-history.lock.json`. Required logs run 42055641890 preflight job 127343409049 found **808 executable SQL files vs 807 applied-source-lock rows** and six migration-identity tests failing, including `supabase-migration-history-integrity.test.mjs`. This is not a problem with the website applicant form itself, and unrelated website PRs should not be required to invent SQL execution evidence.

Connected original Supabase project `adhjwmvyoixzjtmiroln` via read-only `list_migrations` on 5 Nov 2026 at 15:33 UTC returned exactly 808 migration version/name identities. All original first 807 applied rows matched the GitHub lock in the same ordinal position, and only the final provider row was missing from the source lock:
`20261105134200 | original_data_spine_decision_receipt_same_tick_v1`.

## Correction without fake history, direct database mutation or bypass
- Append precisely the independently read final provider version/name to the ORIGINAL `supabase/migration-history.lock.json`; preserve all prior 807 rows and update `captured_at` to actual readback time.
- Do NOT run the already-applied SQL, do not create a second migration, do not rewrite provider migration history and do not suppress Required status checks, migration tests, security gates or original owner release.
- Protect a source regression test `tests/brain-provider-808-source-lock-exact-20261105.test.mjs` for exact record count, chronology, uniqueness, original executable source file and SQL security function privilege rules. Existing six migration-identity tests remain the primary full regression.
- Original operational owner remains protected GitHub/Supabase migration history reconciliation (issue #3742), with project readback + ONE BRAIN fingerprint recorded; this PR is a bounded canonical source lock update, not a new executor.
- Release only through Required/CodeQL, protected merge and verification that new `main` lock has 808 exact identities matching the connected provider. Then retry original website releases #5458 and #5455 as needed. Do not report their website code live until Netlify exact published SHA and customer-facing readback.

Official provider documentation: https://supabase.com/docs/guides/deployment/database-migrations .
