# Development ledger event — 2026-10-22

- Obligation-ID: `delivery|required-watchdog|transient-api-abort-all-prs|20261022-v1`
- Status: CANDIDATE_UNVERIFIED
- Source: `.github/scripts/required-gate-watchdog.mjs`
- Evidence: existing five-minute scheduler source had neither per-call timeout nor per-PR error isolation.
- Root cause classification: source-level vulnerability, runtime frequency not measured.
- Intended fix: GET-only 8s/2-attempt bounded retry; fail-isolated PR scanning; no retries for POST with uncertain side effects; nonzero on partial failure.
- Tests: `tests/brain-required-gate-watchdog-resilience-v1.test.mjs` (must pass on exact head).
- Prevention: next-tick same marker dedup; keep current Required/CodeQL/security admission and no duplicate scheduler.
- Terminal readback: PENDING; no live/proven assertion.
