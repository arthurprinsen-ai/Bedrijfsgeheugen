# 2026-10-29 — Third-party actions pinned to a commit

- Canonical obligation: `ci-supply-chain|third-party-actions-sha-pin|20261029-v1`.
- Defect: four workflow steps ran third-party actions by moving tag with secrets in scope.
- Scope: four workflow files, one existing test assertion, one new guard test, learning and change documentation.
- No change to schedules, triggers, permissions or action code (pins equal what the tags pointed to).
- Settings changed outside Git: default workflow permissions read, no PR approval by workflows, Dependabot security updates on.
- Required next proofs: exact-head Required/CodeQL, protected merge, next scheduled run of each touched workflow stays green.
