# 2026-09-25 — GitHub Actions fast obsolete-run drainage

- Fingerprint: `github|actions-obsolete-run-fast-drain|v1`
- Incident: development pressure reached 19 active/in-progress plus 11 queued Actions runs despite earlier queue-storm governance.
- Root cause: cleanup latency and admission thresholds were too permissive for the repository's real control-plane capacity; provably obsolete work could remain queued for six hours or in-progress for thirty minutes.
- Fix: one total non-terminal capacity budget; soft pressure 8 total / 5 queued; hard circuit 12 total / 8 queued; projected fan-out cap 3; single-flight supervisor every 5 minutes; provably obsolete queued work eligible after 60 seconds and obsolete in-progress after 300 seconds; cleanup budget 100.
- Safety invariant: healthy current-head work is never cancelled merely to lower counts; cancellation remains exact SHA/PR/branch identity driven.
- Provider anomaly handling: proven obsolete runs that GitHub cannot cancel/force-cancel/delete are retained in raw telemetry and classified separately so provider control-plane zombies do not permanently deadlock Powerhouse admission.
- Regression: `tests/brain-actions-queue-storm-guard-v1.test.mjs`, `tests/brain-ci-admission-single-flight.test.mjs`, `tests/delivery-powerhouse-supervisor.test.mjs`, and universal agent continuity coverage.
- Delivery: same canonical PR/obligation; no duplicate recovery lineage; protected checks and current-main readback remain mandatory.
