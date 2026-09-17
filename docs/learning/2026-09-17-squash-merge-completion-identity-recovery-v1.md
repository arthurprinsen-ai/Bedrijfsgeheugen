# Squash-merge completion identity recovery v1

Date: 2026-09-17
Status: IMPLEMENTING
Canonical obligation: `powerhouse-one-loop-v1`
Recovery successor: PR #1984
Predecessor delivery: PR #1968

## Incident

PR #1968 completed its exact-head Required and BRAIN gates and was squash-merged to production/main as `6ae18de754cb33044108d85ba704c965a5287b88`. Production Release Readback run `35272421517` proved that production SHA live, including exact deployment identity and affected production routes.

Two post-merge control-plane defects were then proven. Outcome Obligation Sweep run `35272598381`, job `105375341647`, failed while resolving immutable completion lineage because it unconditionally used `${SOURCE_HEAD_SHA}^2`; the squash-shaped production commit has only one parent. Separately, Config-Wacht run `35272421591`, job `105374772960`, proved that `Powerhouse Merged Branch Cleanup` could exit non-zero while writing durable evidence but without an operator-visible GitHub error annotation.

## Root causes

1. The completion-lineage resolver encoded a two-parent Git topology as universal identity authority. That works for a true merge commit but not for squash-shaped merges. The immutable associated merged PR remains available from GitHub and binds `merge_commit_sha` to the PR's exact `head.sha`.
2. The cleanup workflow had durable JSON evidence and exact-head deletion safeguards, but its EXIT trap could return a failure code without emitting a concrete `::error::` reason. A red operational workflow therefore lacked immediate operator-visible cause.

Failure fingerprints:
- `completion-lineage-two-parent-assumption-on-squash-merge-v1`
- `merged-branch-cleanup-nonzero-without-error-annotation-v1`

## Recovery

The existing `^2` path remains valid for true two-parent merge commits. When it does not produce a 40-hex candidate SHA, Outcome Obligation Sweep queries the GitHub associated-pulls endpoint for the exact production commit and accepts a candidate only when exactly one returned PR is merged and has `merge_commit_sha == SOURCE_HEAD_SHA`; the candidate becomes that PR's immutable `head.sha`.

The resolver remains fail-closed when zero or multiple matching merged PRs exist, or when the resolved candidate is not a 40-hex SHA. The workflow gains only `pull-requests: read`; production-readback identity validation is unchanged.

The merged-branch cleanup EXIT trap keeps writing its durable artifact and preserving the exact-head branch-deletion safeguards. On every non-zero exit it now also emits a concrete `::error::` containing state, detail, branch and expected head SHA before returning the original exit code.

## Regression prevention

`tests/completion-supervisor-evidence.test.mjs` requires:

- `pull-requests: read` is explicitly present;
- second-parent resolution is guarded rather than unconditional;
- associated-pulls lookup is tied to the exact `SOURCE_HEAD_SHA`;
- candidate selection requires `merged_at` and exact `merge_commit_sha` equality;
- exactly one matching PR is required;
- unresolved candidate identity remains fail-closed with `COMPLETION_CANDIDATE_IDENTITY_MISSING`;
- the cleanup EXIT trap always persists evidence and emits `::error::Powerhouse merged branch cleanup failed:` on non-zero exit.

Permanent prevention rules: completion identity must come from immutable delivery evidence, not an assumed Git shape; and every operational workflow with a terminal non-zero path must expose a concrete operator-visible failure reason in the same run while preserving durable evidence.

## Closure criteria

This learning is not terminal merely because recovery code is committed. Closure requires PR #1984 exact-head Required and BRAIN terminal green, protected merge with expected-head identity, current-main/readback proof, successful Production Release Readback, successful Outcome Obligation Sweep persisting trusted candidate and production identities, green Config-Wacht/cleanup verification, and canonical obligation/learning writeback to `FULFILLED` / `LIVE & BEWEZEN`. Until all proofs exist, status remains `IMPLEMENTING`.
