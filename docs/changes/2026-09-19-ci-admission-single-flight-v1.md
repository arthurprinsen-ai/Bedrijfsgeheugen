# CI admission single-flight — 2026-09-19

Fingerprint: `github|ci-admission|single-flight-runner-budget-v1`

## Incident
Runner capacity was amplified during simultaneous Powerhouse development. Required and BRAIN treated native pull-request runs and recovery dispatches as different concurrency groups because their keys contained `github.event_name`. The repository-wide recovery supervisor also reacted to feature-branch pushes.

## Permanent controls
- Required: one PR-scoped concurrency key across native PR and recovery-dispatch triggers.
- Unified BRAIN Delivery: the same trigger-independent PR single-flight rule.
- Recovery Supervisor: push trigger restricted to `main`; explicit dispatch and bounded five-minute reconciliation remain.
- Skill Projection: stale same-PR/ref work is superseded.
- Required executes `tests/github-actions-ci-admission-single-flight.test.mjs`.
- Agent skills and Engineering OS require parallel independent obligations while prohibiting duplicate same-obligation execution.

## Operating model
Many agents may build independent scopes simultaneously. One Obligation-ID has one executable delivery lineage. Cheap admission precedes expensive gates. Superseded work releases runner capacity quickly. Terminal landing is serialized only at the mutable integration boundary.
