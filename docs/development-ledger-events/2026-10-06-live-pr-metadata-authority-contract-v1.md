# Development ledger — live PR metadata authority contract

- Date: 2026-10-06
- Obligation: `live-pr-metadata-authority-contract-20261006-v1`
- Trigger: final tools/ci live-proof PR #3993 exposed a stale automation regression.
- Runtime behavior was already correct on protected main.
- Repair changes the regression contract only; it does not weaken metadata validation.
- Complete live PR metadata is authoritative; incomplete metadata still fails over to the validated versioned manifest.
