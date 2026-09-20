# Development ledger — Powerhouse Control Center admin gate recovery v1

Date: 2026-09-20
Obligation: `powerhouse-control-center-admin-gate-v1`
Supersedes delivery state from PR #2448.

## Why this recovery exists
PR #2448 merged the security implementation, but Skill Projection failed because the security-sensitive learning evaluation did not satisfy the full canonical contract. A first recovery added a second executable regression; the gate then correctly required an explicit `shadow` evaluation for security-sensitive learning.

## Recovery
- two executable Brain security regressions;
- historical replay, canary and shadow evaluation all reference those tests;
- the admin-only endpoint and client authorization implementation remain unchanged;
- this recovery is manually merged only after Skill Projection, Required, BRAIN and CodeQL are green.

## Prevention
Security-sensitive learnings must include replay, canary and shadow evaluation before terminal delivery. Recovery PRs must also carry their own human documentation and ledger evidence.
