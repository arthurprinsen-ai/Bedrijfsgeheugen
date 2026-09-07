# Parallel release migration for current open PRs

This governance change is intentionally non-destructive for work already in progress.

- Do not reset, force-push, mass-rebase or retarget current product PRs merely to adopt change-scoped release lanes.
- Existing website fixes remain website-lane work; existing Portal Next work remains portal-lane work; mixed growth/runtime changes may activate more than one lane when their changed paths genuinely cross domains.
- After the governance change lands on `main`, the next pull-request event or explicit rerun should evaluate the existing PR head using the new lane-aware required-test contract.
- Non-overlapping movement on `main` keeps the tested feature candidate.
- Synchronize only for a real merge conflict, exact changed-path overlap, declared contract overlap, or declared dependency conflict.
- Draft PRs remain non-promotable.
- Production promotion still requires exact tested-head identity, relevant deploy-preview/live readback and BG169 execution evidence.
