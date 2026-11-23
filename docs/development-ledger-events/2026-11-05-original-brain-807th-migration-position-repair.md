# Development ledger — data-spine original historical migration assertion

- Date: 2026-11-05; original owner GitHub Required/ONE BRAIN/data-spine.
- Failure: exact-head BRAIN run #42063349533 backend test #1378 on [#5468](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5468) (all other backend tests passed). Historical original migration `20261105132000` was incorrectly required to be the latest applied; protected provider #808 is now `20261105134200`.
- Root cause class: legitimate append-only provider migration invalidated stale *latest* test oracle, not source SQL or database privileges.
- Fix: test only, maintain original exact historical row and position 807; preserve all security checks, source identity, separate current-version parity tests. No scheduler, provider, runtime or data changes.
- Prevention: any fixed historical test asserts provenance and immutability, never indefinite lastness. New applied provider records always synchronized through original immutable lock (#5462), protected checks, provider readback and post-merge BRAIN.
- Verification pending exact-head Required, CodeQL, original BRAIN run, protected merge and production source readback. Fingerprint `brain|data-spine|historical-807th-lock-test-broke-after-valid-808th|20261105-v1`.
