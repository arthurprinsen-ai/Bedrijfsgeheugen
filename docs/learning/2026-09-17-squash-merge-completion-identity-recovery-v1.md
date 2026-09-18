# Squash-merge completion identity recovery v1

Date: 2026-09-17
Status: LIVE & BEWEZEN
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

## Closure evidence

The recovery is terminally proven on 2026-09-17:

- PR #1984 exact candidate head `97c01ebf4c4e0538fdf3d012e2c2838aad6d6d04` completed Required run `35274102801`, BRAIN delivery run `35274102768`, and CodeQL run `35274102310` successfully.
- PR #1984 was protected-merged to current main as `4fda9309eefa259b2a7f492ca929b8d472055d5e` at 2026-09-17T21:06:36Z; the commit is verified and directly descends from the prior production main SHA.
- Production Release Readback run `35274800041` completed successfully for `4fda9309eefa259b2a7f492ca929b8d472055d5e`, including exact live release marker/deploy identity, connector readiness, affected production routes, and immutable website production truth.
- Outcome Obligation Sweep run `35274818942` completed successfully and resolved immutable completion lineage, trusted source artifacts, and persisted trusted completion evidence in the existing obligation lineage without the former squash-parent failure.
- Powerhouse Merged Branch Cleanup run `35274800189` completed successfully, deleted the exact merged same-repository branch, and uploaded durable cleanup evidence.
- No parallel executable recovery candidate remains authoritative.

## Closure

All closure criteria are now proven. Canonical terminal state for this learning is `LIVE & BEWEZEN`; the corresponding obligation is fulfilled by the protected merge plus exact-main runtime/readback and same-lineage completion evidence above. Any future regression must reopen a new recoverable execution state from this proven checkpoint rather than downgrade or fork this historical terminal evidence.


## Operational verification learning — 2026-09-18

This incident also established a reusable verification rule for future Powerhouse recovery work.

A terminal status must never be accepted from PR text, a chat summary, or a single green check alone. Before reporting `LIVE & BEWEZEN`, the recovery owner must independently read back all relevant authorities for the same obligation lineage:

- the canonical PR state and immutable delivery identity;
- current `main` and the proven merge/ancestry relationship;
- the exact Required/BRAIN or equivalent delivery gates for the candidate;
- post-merge operational workflows, including obligation reconciliation and cleanup where applicable;
- production/runtime readback for the affected surface;
- the canonical learning/writeback state on `main`.

A later `main` SHA does not invalidate an already proven historical closure. Verification must distinguish "current repository head" from "the immutable production/main SHA that proved this obligation". If the historical closure evidence remains present and no new regression evidence exists, agents must reuse that proven checkpoint instead of reopening, duplicating, or forking the obligation.

Permanent reusable rules:

1. **Evidence fan-in before closure** — terminal completion requires independent corroboration from delivery, main, runtime/readback, and canonical learning state.
2. **No prose-as-authority** — PR descriptions and prior chat claims are navigation hints, never sufficient completion evidence by themselves.
3. **Historical closure immutability** — subsequent unrelated main commits do not downgrade a proven `LIVE & BEWEZEN` checkpoint.
4. **Reopen only on new evidence** — a fulfilled obligation may only re-enter recovery when a new concrete regression, failed contract, failed runtime/readback, or conflicting canonical state is observed.
5. **Same-lineage learning** — post-incident learnings belong in the existing canonical incident/obligation record unless a genuinely new failure fingerprint exists; avoid parallel learning records for the same root cause.
6. **Verification itself is part of execution** — chat/agent work is not complete when a fix is merged; independent readback and durable learning/writeback are mandatory execution steps.

These rules are intended to prevent false completion, duplicate recovery PRs, stale-state reopening, and chat-to-chat drift while preserving the existing One Loop principle: recover from the last proven checkpoint, not from memory or assumption.
