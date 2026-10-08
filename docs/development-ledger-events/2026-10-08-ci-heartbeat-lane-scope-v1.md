# Development ledger — bounded Heartbeat CI lane scoping

- Date: 2026-10-08.
- Obligation: powerhouse-ci-heartbeat-lane-scope-20261008-v1.
- Root cause: known backend-only improvement runtime contract/probe classified as generic shared change.
- Evidence: PR #4171 Required test selected all product lanes and Netlify build parity for a non-website mutation.
- Remedy: add exactly two scoped backend paths to existing delivery planner, with positive and negative lane regression fixtures.
- Scope: tools/brain-delivery-system.mjs; tests/brain-change-scoped-release-lanes.test.mjs; canonical learning, human docs and this append-only ledger.
- Safety: global shared config, unknown paths, migration/security and actual website/portal source stay fail-closed; Required, CodeQL and protected promotion unchanged.
- State: candidate; protected Required/CodeQL and exact merge pending.
- Rollback: protected revert if a substantive dependency is missed.
