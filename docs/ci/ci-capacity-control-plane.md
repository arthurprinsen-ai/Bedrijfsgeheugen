# CI Capacity Control Plane — canonical rule

Status: canonical release-engineering rule. This document belongs with `config/ci-workflow-topology.json`, `tests/ci-workflow-topology.test.mjs`, `tools/ci/workflow-topology.mjs` and `.github/workflows/required-test.yml`.

## Permanent invariant

Pull-request validation has exactly one active GitHub Actions ingress: `.github/workflows/required-test.yml`.

All pre-merge quality checks must be routed from that workflow into canonical lanes. A new standalone `pull_request` workflow is a regression, even when it is path-scoped, because it can recreate repository-wide runner fan-out and queue contention.

Post-merge production readback, scheduled maintenance, special branch flows and explicit `workflow_dispatch` operations remain separate when their lifecycle is not PR validation.

## Concurrency contract

`Required test` uses PR-scoped supersession. A newer commit may cancel obsolete validation for the same PR, but must never cancel work for another PR or share a repository-global PR lock.

Production readback has separate concurrency and is never coupled to PR-validation concurrency.

## Quality contract

Reducing runner usage must never mean silently removing coverage. Before a standalone PR workflow loses its `pull_request` trigger, every unique pre-merge assertion it owns must already be present in the appropriate canonical lane or preflight.

Unknown/unclassified changes fail closed or route conservatively; they are never silently skipped.

The protected compatibility context remains `test`, emitted by the canonical Required flow. Do not reintroduce a polling/status-bridge runner merely to synthesize this context when the canonical GitHub Actions check already satisfies it.

## Queue-health contract

A current-head required preflight/classifier with no first runner step after 5 minutes is a capacity incident. Superseded heads are not incidents. Capacity incidents must not create automatic rerun storms.

## Production truth

A release is not complete because PR checks are green or because a merge succeeded. Completion requires production readback tied to the exact merged SHA. If the exact SHA cannot be proven live, the release remains open.

## Prevention

The repository must keep a machine-enforced topology regression test in Required preflight. That test must fail when an additional active `pull_request` workflow appears, when same-PR supersession is removed, or when PR validation becomes coupled to production concurrency.

Fingerprint: `ci-capacity-control-plane-single-pr-ingress-v1`

Root cause learned: many individually reasonable PR workflows created aggregate runner fan-out and queue starvation. Prevention is architectural ownership through one ingress plus lane routing, not ad-hoc cancellation, disabling quality gates, or adding more polling runners.
