# Original Supabase provider 872 / Git migration-history source lock 871 — exact readback repair

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Independent source truth
Native read-only Supabase project `adhjwmvyoixzjtmiroln`, 15 Nov 2026 17:03:59 UTC: 872 actually applied records; final version/name `20261115235500/sales_action_reexecution_immutable_attempt_lineage_v1`. Git `main` source lock has exactly 871 records, all matching the provider prefix; original executable SQL already exists in `supabase/migrations/`. No missing historical versions, mismatched names or duplicate SQL. This gap blocked protected PR #5880, not a license to disable the protected migration test.

## Minimal original owner repair
Append only original provider-attested version/name #872 and provider timestamp to the original `supabase/migration-history.lock.json`. Preserve first 871 records. Make original provider 871 historical regression prefix-forward-compatible: it must assert immutable index 870, not freeze whole history length; add original provider 872 source-executable exact-match regression. No SQL execution, migration creation, privilege/cron mutation, parallel service, fabricated proof, or customer/agent terminal claim.

## Release requirements
Exact-head protected Required/CodeQL; protected merge to main; independently re-read source lock and native provider; then rebase/retest original waiting consumer ACK/learning PR #5880 and re-check exact deployed production source. Until then #4198 remains OPEN for original consumer processed ACK, source-linked applied learning and independent measured business outcome.
