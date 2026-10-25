# Migration source recovery — Brain agent contract

Owner: existing #3742 Supabase migration-history recovery supervisor. Do not start a competing scheduler or writer.

Detection: `node tools/brain/migration-source-preflight.mjs` returns nonzero for obsolete source references and outputs exact files, lines, archival candidates, and ambiguous cases.

Bounded recovery: run `node tools/brain/migration-source-preflight.mjs . --apply` only on a disposable candidate branch, never on protected main. The script rewrites references in test source only when the same filename exists as nonempty SQL in the repository-only historical archive. It never changes executable SQL, assertions, or database history. Ambiguous files are not modified.

After repair: inspect diff and original SQL archive blob identity, execute targeted historical tests and `node --test tests/brain-migration-source-preflight-20261025.test.mjs`, rerun detection, then full Unified BRAIN backend, Required, CodeQL, Supabase Preview migration parity and clean-room replay. If any gate fails: preserve failure cluster in the existing Brain learning and existing incident obligation, update the same candidate branch, and do not merge. Only exact-head required green plus protected merge and production readback can close the obligation.

Never add empty SQL shims, execute retired archived SQL, overwrite genuine production migration ledger entries, delete negative security assertions, skip checks or treat CI as proof of customer/provider acceptance.
