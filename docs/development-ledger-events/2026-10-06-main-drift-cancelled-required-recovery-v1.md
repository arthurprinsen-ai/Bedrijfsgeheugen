# Development ledger event — main drift cancelled Required recovery

Date: 2026-10-06  
Obligation-ID: main-drift-cancelled-required-recovery-20261006-v1  
Fingerprint: ci|main-drift|cancelled-required|checks-expected|same-lineage-refresh-v1

Observed failure mode: a stale-head Required cancellation was classified as a failed gate before moving-main recovery, so a leased PR could remain open with branch-protection checks expected.

Correction: prioritize same-lineage `MAIN_DRIFT_RECOVERY` for a cancelled canonical Required only when the PR is behind main and no newer Required is active. Real failures remain fail-closed.

Executable proof: `tests/delivery-powerhouse-supervisor.test.mjs`.
