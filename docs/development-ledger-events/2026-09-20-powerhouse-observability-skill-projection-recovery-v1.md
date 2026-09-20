# Development ledger — observability skill projection recovery v1

Date: 2026-09-20
Obligation: `powerhouse-observability-command-center-v1`
Supersedes delivery state from PR #2445.

## Incident

PR #2445 merged while the Powerhouse Skill Projection workflow was red. The failing reason was deterministic: the learning file referenced `tests/portal-powerhouse-observability-command-center.test.mjs`, which the learning canonicalization contract rejected.

## Recovery

- move the regression to `tests/brain-powerhouse-observability-command-center-v1.test.mjs`;
- update the canonical learning replay path;
- retain the same observability implementation on current main;
- re-run protected delivery and skill projection;
- require terminal readback before claiming the cockpit fully closed.

## Prevention

A merged PR with red skill projection remains recoverable incomplete state. Merge is transport, not terminal proof.
