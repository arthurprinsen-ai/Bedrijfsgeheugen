# Writer shadow explicit dispatch — 2026-10-06

Repository Writer Candidate Shadow no longer subscribes to every pull request. All seven governed writers now resolve the exact candidate PR identity and explicitly dispatch the read-only shadow verifier.

This removes one unnecessary GitHub Actions run from ordinary PRs while preserving the same writer path-policy, immutable base/head/ref validation, evidence artifact, and central writer gate dispatch.

The shadow workflow is now dispatch-only and cannot infer writer identity from generic pull-request context.
