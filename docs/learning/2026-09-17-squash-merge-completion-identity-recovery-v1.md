# Squash-merge completion identity recovery v1

Date: 2026-09-17
Status: IMPLEMENTING
Canonical obligation: `powerhouse-one-loop-v1`
Recovery successor: PR #1984
Predecessor delivery: PR #1968

## Incident

PR #1968 completed its exact-head Required and BRAIN gates and was merged to production/main as `6ae18de754cb33044108d85ba704c965a5287b88`. Production Release Readback run `35272421517` proved that production SHA live, including the exact deployment identity and affected production routes.

The downstream Outcome Obligation Sweep then failed while resolving immutable completion lineage. The sweep assumed that every Production Release Readback source SHA is a two-parent merge commit and unconditionally resolved the original candidate with `${SOURCE_HEAD_SHA}^2`. The production commit for PR #1968 is a squash-merge-shaped one-parent commit, so no second parent exists even though the merged PR and its exact candidate head remain available from GitHub.

## Root cause

The completion-lineage resolver encoded Git topology as the identity authority. That is valid for a two-parent merge commit but not for squash or rebase-shaped merges. A successful protected production commit can therefore have one parent while still having an immutable associated merged PR whose `merge_commit_sha` equals that production commit.

Failure fingerprint: `completion-lineage-two-parent-assumption-on-squash-merge-v1`.

## Recovery

The existing `^2` path remains the primary resolver for true two-parent merge commits. When that does not produce a 40-hex candidate SHA, the sweep queries the GitHub associated-pulls endpoint for the exact production commit and accepts a candidate only when exactly one returned PR is merged and has `merge_commit_sha == SOURCE_HEAD_SHA`. The candidate is then that PR's immutable `head.sha`.

The recovery remains fail-closed when zero or multiple matching merged PRs exist, or when the resolved candidate is not a 40-hex SHA. The workflow gains only `pull-requests: read`, which is the minimum permission needed for this identity readback. Existing production-readback identity validation is unchanged.

## Regression prevention

`tests/completion-supervisor-evidence.test.mjs` now requires all of the following:

- `pull-requests: read` is explicitly present;
- second-parent resolution is guarded rather than unconditional;
- the associated-pulls lookup is tied to the exact `SOURCE_HEAD_SHA`;
- candidate selection requires `merged_at` and exact `merge_commit_sha` equality;
- exactly one matching PR is required;
- unresolved or ambiguous candidate identity remains fail-closed with `COMPLETION_CANDIDATE_IDENTITY_MISSING`.

Permanent prevention rule: completion identity must be derived from immutable delivery evidence, not from an assumed Git merge shape. Git topology may be used when it proves identity, but squash/rebase merges require exact associated-PR identity before completion evidence may be persisted.

## Closure criteria

This learning is not terminal merely because the recovery code is committed. Closure requires the recovery successor's exact-head Required and BRAIN gates to be terminal green, protected merge with expected-head identity, current-main/readback proof, and a successful Outcome Obligation Sweep that persists the trusted candidate and production identities in the existing completion obligation lineage. Until those proofs exist, status remains `IMPLEMENTING`.
