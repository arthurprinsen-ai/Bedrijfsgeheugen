# Development Operating System

## Purpose
This is the canonical execution flow for Bedrijfsgeheugen changes across development, preview and production. It complements `AGENTS.md`, `docs/self-healing-agents.md` and `docs/outcome-obligations.md`.

## Mandatory sequence
1. Read `AGENTS.md`, this file, `docs/development-ledger.md`, `docs/self-healing-agents.md`, `docs/outcome-obligations.md`, the shared-agent-memory design and current Powerhouse Team Memory.
2. Dedupe by fingerprint and reuse known fixes before exploring new hypotheses.
3. Materialize every expected result as an outcome obligation with owner, deadline, evidence policy, idempotency key and recovery policy.
4. Protect last-known-good production.
5. Reproduce with concrete build/runtime/deploy evidence.
6. Add or strengthen a regression gate before the repair where practical.
7. Apply the smallest reversible root-cause fix.
8. Verify candidate tests and exact preview artifact/SHA.
9. Red is non-terminal: iterate with new evidence; maximum two identical retries per hypothesis.
10. Promote a green candidate to production automatically.
11. Verify exact production SHA/deploy, smoke/regression and protected metrics.
12. Reconcile expected obligations against verified outcomes. Technical success, an empty result set or `zero candidates` is not green when an outcome is expected.
13. If production regresses, rollback immediately to last-known-good and continue repair on the safe route.
14. Write ERROR/RECOVERY/IMPROVEMENT/MISSED_OBLIGATION/AUTO_REPAIR/PRODUCTION_PROMOTION/PRODUCTION_ROLLBACK to the repo ledger and shared learning.

## Protected invariants
- `NO SILENT FAILURE`.
- `NO LOST OBLIGATION`.
- `GREEN MEANS OUTCOME VERIFIED`.
- `RED MEANS AGENTS KEEP WORKING`.
- No secret/credential/permission changes without explicit authorization.
- Never weaken security controls.
- No destructive or irreversible data mutations.
- No paid-resource increases or legally/financially binding actions.
- Production must remain on last-known-good when a candidate is red.
- Exact deploy/commit identity is part of acceptance.
- Documentation and learning writeback are release requirements, not optional follow-up.

## Release gate
A candidate is green only when relevant tests pass, required knowledge files exist, preview is verifiably healthy, rollback is known and all obligations created by the change have either verified outcome evidence or an explicit valid hard boundary. Production is green only after the exact promoted SHA is verified in production.
