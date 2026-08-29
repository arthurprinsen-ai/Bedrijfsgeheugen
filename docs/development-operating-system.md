# Development Operating System

## Purpose
This is the canonical execution flow for Bedrijfsgeheugen changes across development, preview and production. It complements `AGENTS.md`, `docs/self-healing-agents.md` and `docs/outcome-obligations.md`.

## Mandatory sequence
1. Read `AGENTS.md`, this file, `docs/development-ledger.md`, `docs/self-healing-agents.md`, `docs/outcome-obligations.md`, the shared-agent-memory design and current Powerhouse Team Memory.
2. Dedupe by fingerprint and reuse known fixes before exploring new hypotheses.
3. Identify the expected outcome/obligation and its independent verification evidence; execution success alone is never enough.
4. Protect last-known-good production.
5. Reproduce with concrete build/runtime/deploy/outcome evidence.
6. Add or strengthen a regression gate before the repair where practical.
7. Apply the smallest reversible root-cause fix.
8. Verify candidate tests and exact preview artifact/SHA.
9. Red is non-terminal: iterate with new evidence; maximum two identical retries per hypothesis.
10. Promote a green candidate to production automatically.
11. Verify exact production SHA/deploy, smoke/regression and protected metrics.
12. If production regresses, rollback immediately to last-known-good and continue repair on the safe route.
13. Write ERROR/RECOVERY/IMPROVEMENT/PRODUCTION_PROMOTION/PRODUCTION_ROLLBACK to the repo ledger and shared learning.

## Whole-brain outcome invariant
The highest reliability rule is defined in `docs/outcome-obligations.md`: **NO SILENT FAILURE. NO LOST OBLIGATION. GREEN MEANS OUTCOME VERIFIED. RED MEANS AGENTS KEEP WORKING.**

A workflow that exits successfully with zero candidates, zero work or zero output is RED when an expected outcome is already due and unverified. Every production-critical process must declare its obligation, evidence source, verification rule, idempotency protection, owner and recovery route. Open RED obligations automatically resume until verified or a genuine hard boundary is reached.

## Protected invariants
- No secret/credential/permission changes without explicit authorization.
- Never weaken security controls.
- No destructive or irreversible data mutations.
- No paid-resource increases or legally/financially binding actions.
- Production must remain on last-known-good when a candidate is red.
- Exact deploy/commit identity is part of acceptance.
- Documentation and learning writeback are release requirements, not optional follow-up.

## Release gate
A candidate is green only when relevant tests pass, required knowledge files exist, preview is verifiably healthy, rollback is known, and the intended outcome can be independently verified. Production is green only after the exact promoted SHA is verified in production.
