# Development Operating System

## Purpose
This is the canonical execution flow for Bedrijfsgeheugen changes across development, preview and production. It complements `AGENTS.md` and `docs/self-healing-agents.md`.

## Mandatory sequence
1. Read `AGENTS.md`, this file, `docs/development-ledger.md`, `docs/self-healing-agents.md`, the shared-agent-memory design and current Powerhouse Team Memory.
2. Dedupe by fingerprint and reuse known fixes before exploring new hypotheses.
3. Protect last-known-good production.
4. Reproduce with concrete build/runtime/deploy evidence.
5. Add or strengthen a regression gate before the repair where practical.
6. Apply the smallest reversible root-cause fix.
7. Verify candidate tests and exact preview artifact/SHA.
8. Red is non-terminal: iterate with new evidence; maximum two identical retries per hypothesis.
9. Promote a green candidate to production automatically.
10. Verify exact production SHA/deploy, smoke/regression and protected metrics.
11. If production regresses, rollback immediately to last-known-good and continue repair on the safe route.
12. Write ERROR/RECOVERY/IMPROVEMENT/PRODUCTION_PROMOTION/PRODUCTION_ROLLBACK to the repo ledger and shared learning.

## Protected invariants
- No secret/credential/permission changes without explicit authorization.
- Never weaken security controls.
- No destructive or irreversible data mutations.
- No paid-resource increases or legally/financially binding actions.
- Production must remain on last-known-good when a candidate is red.
- Exact deploy/commit identity is part of acceptance.
- Documentation and learning writeback are release requirements, not optional follow-up.

## Release gate
A candidate is green only when relevant tests pass, required knowledge files exist, preview is verifiably healthy, and rollback is known. Production is green only after the exact promoted SHA is verified in production.
