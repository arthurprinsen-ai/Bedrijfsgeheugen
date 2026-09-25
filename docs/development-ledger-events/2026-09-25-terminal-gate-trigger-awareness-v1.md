# Development ledger — attainable Brain evidence for terminal closure

Date: 2026-09-25
Obligation: `governance-production-trigger-ownership-v1`
Supersedes: PR #3108 terminal-closure deadlock

## Failure evidence
Terminal closure run `36175492847` remained in `Verify exact-head critical delivery gates before terminal claim` although Required, Skill Projection and CodeQL had completed successfully.

## Root cause
The terminalizer depended on a Unified Brain exact-head run that was not available for the merged candidate.

## Repair
The closure workflow now:
- accepts a successful existing Unified Brain exact-head run when present;
- otherwise requires successful Brain foundation verification on the merge SHA;
- fails closed on failed or non-terminal Brain evidence.

## Prevention
Brain regression coverage enforces `TERMINAL_GATE_MUST_USE_ATTAINABLE_EQUIVALENT_EVIDENCE_PATH`.
