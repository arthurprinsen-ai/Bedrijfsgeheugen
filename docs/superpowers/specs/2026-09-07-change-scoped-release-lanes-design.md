# Change-scoped parallel release lanes

## Goal

Bedrijfsgeheugen/Powerhouse must support parallel development and independent production release. Multiple fixes/features may be developed in separate branches/worktrees/PRs and each may be merged and deployed as soon as its own blocking gates are green. An unrelated failing or open change must never block a production-ready change.

## Current problem

The repository already contains BRAIN-DELIVERY-v2 lanes and conflict-aware moving-main handling, but the required CI surface still contains monolithic checks. In particular, `Required test` currently mixes Brain/delivery contracts with website/UI/browser contracts for every pull request. This means a lane can be technically independent while still being blocked by tests outside its material scope.

## Architecture

Use the existing `config/brain-delivery-system.json` lane registry as the single source of truth for change classification. Every PR is classified from its changed paths into one or more lanes (`backend`, `portal`, `website`, `automation`). A small shared safety baseline is always blocking; lane-specific suites are blocking only when that lane is material to the PR. Irrelevant suites are skipped rather than failed.

`Unified Brain Delivery` remains the exact-SHA governance and conflict-aware production authority path. Non-overlapping movement on `main` keeps the tested candidate; synchronization is required only for actual merge conflict, exact path overlap, declared contract overlap, or declared dependency conflict.

## Required-test contract

The single required status name remains stable for compatibility with existing branch protection. Internally it becomes lane-aware:

- Always blocking: classifier validity, delivery policy validity, shared safety smoke and unclassified-path fail-closed behavior.
- `backend`: Brain adapters, event retention, failure learning, Make cost governance, backend delivery contracts.
- `portal`: portal routing, portal production contracts and portal-specific regressions.
- `website`: V18/site shell/SEO/UI/browser checks and deploy-preview visibility/interactions.
- `automation`: delivery/automation governance tests.

A PR that changes shared executable governance paths intentionally fans out to all affected lanes.

## Existing PR compatibility

No current feature PR is reset, force-pushed, mass-rebased, or retargeted. After this governance PR lands on `main`, open PRs continue from their existing heads. Their next PR event/rerun evaluates against the new change-scoped gate contract. If `main` moved without material overlap, the tested branch remains valid. If there is real overlap, only that PR must synchronize.

The currently open website fixes (including homepage, prices and standalone menu-page fixes) remain website-lane work. Portal Next remains portal-lane work. Growth changes touching website and backend assets may legitimately activate multiple lanes. Draft PRs remain non-promotable until marked ready.

## Production release

Each candidate keeps an immutable tested head SHA. Production promotion may proceed independently when:

1. its blocking lane checks are green;
2. deploy preview/readback for affected runtime surfaces is green;
3. branch drift says `KEEP_TESTED_FEATURE`, or required synchronization has been completed;
4. the PR is open, non-draft and mergeable;
5. BG169 exact-SHA authority verifies the candidate and merge result.

Post-merge production verification remains scoped to the affected runtime surfaces. Failure records an outcome/learning obligation and permits rollback of that change without treating unrelated lanes as failed.

## Safety constraints

- Unknown active paths fail closed.
- Shared executable control-plane changes may fan out across all lanes.
- No direct production bypass is introduced.
- No change may claim production success without exact-SHA merge/deploy evidence and live readback where applicable.
- No generic moving-main rebuilds.
- Existing PR content is preserved.

## Acceptance criteria

- A website-only PR does not execute or fail on unrelated backend/Brain test suites.
- A backend-only PR does not execute or fail on unrelated website browser/SEO suites.
- A portal-only PR does not execute or fail on unrelated website or backend suites.
- Shared delivery-control-plane work fans out and remains fail-closed.
- `Required test` keeps its existing status identity while becoming lane-aware.
- Non-overlapping `main` drift does not require a rebuild/rebase.
- Existing open PRs can adopt the new gate contract without destructive branch rewriting.
