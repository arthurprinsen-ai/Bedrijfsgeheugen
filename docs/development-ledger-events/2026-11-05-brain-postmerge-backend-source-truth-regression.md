# BRAIN postmerge backend regression: original source reality versus outdated tests

- Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Same original BRAIN run: #42059928039 backend job #127358913479. Terminalizer #42059796291 failed on this critical gate. Historical failures must not be reclassified.
- Canonical protected current source `.github/workflows/required-test.yml` uses `fetch-depth:0` for immutable migration diff classification, while separate `.github/workflows/lane-website.yml` remains bounded `fetch-depth:2` with `TARGETED_BASE_FETCH`.
- Canonical lock is `supabase/migration-history.lock.json`: 808 ordered entries; original `20261105132000` still exists; provider-approved append `20261105134200` is next. Test should demand append-only invariants, not an ancient last-entry marker.
- Candidate edits: `tests/brain-ci-control-plane-convergence-v1.test.mjs` and `tests/brain-data-spine-original-ten-minute-stage-proof-20261105.test.mjs`, one BRAIN learning record, docs/ledger. No changes to any running website, real traffic measurement, Supabase security, or migration.
- Required before GREEN: exact-head checks, protected merge, independent protected-main BRAIN re-execution and terminal provider evidence. Await actual SEO organic clicks → legitimate lead → paid receipts; neither migration compliance nor code-only change proves sales.
