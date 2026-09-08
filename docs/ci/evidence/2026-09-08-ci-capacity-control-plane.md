# CI Capacity Control Plane — release evidence

## Scope

Atomic repository-wide migration of PR verification to one canonical `Required test` ingress. This migration intentionally spans the workflow tree; splitting it would temporarily preserve duplicate `pull_request` runners and violate the topology invariant.

## Before

Focused PRs could fan out into 15+ GitHub Actions workflows, including duplicate shell, SEO, learning, pricing, writer, V18 and status-bridge runners.

## Candidate evidence

- Candidate PR: #1221
- Previous candidate head: `136f7239fadec772f1e4e6229d40c32be73257f7`
- GitHub started exactly one pull-request workflow on that head: `Required test`.
- The repository topology contract passed 4/4.
- Mandatory chat-learning preflight reported `READY`.
- Branch hygiene reported `unexpectedPaths: []`; the only RED was the default 40-file ceiling for this 54-file atomic workflow migration.
- Broad scope is explicitly bounded by PR metadata (`Change-Scope`, `Scope-Budget: 60`) and label `scope-broad-approved`.

## Permanent invariants

1. Exactly one active `pull_request` workflow: `.github/workflows/required-test.yml`.
2. Supersession is scoped to the same PR; independent PRs do not share a global lock.
3. The protected check remains named `test`.
4. Quality contracts formerly owned by standalone PR workflows execute in canonical backend, portal, website or automation lanes before merge.
5. Production readback is push-main only, serialized separately, non-cancellable, and validates the exact deployed commit before release completion is claimed.
6. Post-merge-only reconciliation remains separate from PR capacity accounting.

## Release completion

This document is pre-merge evidence. Final completion requires the exact candidate head to pass `Required test`, merge to `main`, and the exact merge SHA to pass production deployment/readback.
