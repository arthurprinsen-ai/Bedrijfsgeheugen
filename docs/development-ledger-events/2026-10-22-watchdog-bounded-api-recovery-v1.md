# Development ledger — 2026-10-22 — bounded watchdog GitHub calls

Obligation-ID: `github|watchdog|bounded-read-retry-and-write-reconciliation|20261022-v1`
Delivery-Lane: automation
Event: RECOVERY_CANDIDATE_CREATED
Source gap: uncapped network time per GitHub request in canonical five-minute gate watchdog.
Safeguard: timeout and finite GET-only retries; ambiguous writes remain fail-closed and idempotent via existing readback.
Files: .github/scripts/required-gate-watchdog.mjs, tools/delivery/failed-gate-owner-routing.mjs, tests/brain-required-failed-gate-owner-routing-v1.test.mjs.
Learning: brain/learning/2026-10-22-watchdog-bounded-api-recovery-v1.json
Verification: PENDING exact-head CI, CodeQL, protected merge and production readback.
