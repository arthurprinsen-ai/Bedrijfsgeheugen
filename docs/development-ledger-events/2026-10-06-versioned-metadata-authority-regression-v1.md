# Development ledger — versioned metadata authority regression v1

- Date: 2026-10-06
- Obligation: `versioned-metadata-authority-regression-20261006-v1`
- Failure class: `UNRELATED_SCOPE_BLEED_REVERSED_VERSIONED_METADATA_AUTHORITY`
- Introduced by: #3986
- Intended #3986 scope: shallow-safe material writeback.
- Unintended collateral change: delivery metadata resolver started preferring complete PR-body metadata over the versioned manifest.
- Repair: restore the #1968 authority order for the same obligation.
- Regression authority: `tests/powerhouse-one-loop-versioned-metadata-authority.test.mjs`.
- Safety: a manifest for a different obligation never overrides the PR body.
