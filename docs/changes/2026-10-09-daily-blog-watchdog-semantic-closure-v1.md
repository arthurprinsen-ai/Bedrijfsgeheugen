# Native daily blog live-proof workflow — structural repair

## Before
The production blog existed, but the native watchdog's four-phase delivery chain ended in a **one-file ledger-only PR**. Required GitHub admission expects independent Brain learning, an append-only delivery event, and a human change note on the *same material candidate*. PR #4260 was rejected with missing evidence for all three. Generated pull-request descriptions also lacked the normalized machine-readable delivery contract and date-level deduplication.

## After
The existing scheduled/manual watchdog still performs its original strict public HTTP 200 / exact canonical / exact content-id / heading check, then writes one date-scoped atomic candidate containing the ledger and all three semantic closure artifacts. It uses the existing writer candidate factory, validates the exact file list, records required PR metadata and enables protected auto-merge. It detects an already-open date-keyed proof candidate and avoids creating a second PR. No new scheduler, publisher, Supabase function, or downgrade of identity/proof checks.

## Regressions and limits
The regression tests enforce proof-first, closure artifacts, candidate allowed file set, uniqueness guard and protected PR metadata. A successful check only proves the workflow was correctly implemented; a new day's live delivery still requires provider readback. Social media and email channels remain separately blocked until real provider receipts exist.
