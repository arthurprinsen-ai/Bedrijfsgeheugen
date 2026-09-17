# POWERHOUSE-DELIVERY-HYGIENE-v1

Date: 2026-09-17
Status: LIVE & BEWEZEN
Initial design base main SHA: fb0c1684dc9697df55ec831ff4dff70c126ce46c
Latest proven main SHA: 986be03a0a0c7c4417a280cb5a09803b65e25937

## Problem

The repository already has strong delivery primitives: change-lane classification, branch hygiene, conflict contracts, SHA-specific concurrency, protected main, production/readback checks and canonical Powerhouse learning. The missing layer was repository-wide admission control. Multiple agents could still create overlapping or successor pull requests for the same obligation, broad workflow fan-out could start before a candidate was proven admissible, moving-main churn multiplied verification work, and superseded candidates could remain open and continue consuming CI capacity.

The objective is to make one canonical delivery lineage the only active execution path for each obligation while preserving existing security, integrity, release and evidence gates.

## Design principles

1. EXISTING-STATE-FIRST: extend BRAIN-DELIVERY-v2 and current GitHub workflows; do not introduce a second delivery brain, database or queue.
2. REUSE-FIRST: reuse current lane classification, conflict contracts, branch hygiene and completion/readback contracts.
3. FAIL-CLOSED: ambiguous ownership, duplicate active candidates, unsafe supersession or stale promotion identity block expensive execution rather than guessing.
4. ONE OBLIGATION, ONE ACTIVE CANDIDATE: there may be historical candidates, but only one executable candidate per canonical obligation.
5. CHEAP BEFORE EXPENSIVE: repository admission and scope checks run before broad test, build, preview or production-like work.
6. DETERMINISTIC CLEANUP: automated closing or branch removal is allowed only with explicit or machine-provable lineage and exact identity. Heuristic similarity never closes or deletes potentially unique work.
7. LIVE & BEWEZEN INCLUDES HYGIENE: closure is incomplete while superseded delivery state remains open, merged same-repository feature branches remain unnecessarily live, or canonical lineage disagrees between GitHub and Powerhouse.

## Scope

### Existing components extended

- `config/brain-delivery-system.json`
- `tools/delivery-branch-hygiene-guard.mjs`
- `tools/brain-delivery-system.mjs` and focused delivery-hygiene logic under `tools/delivery/`
- `.github/workflows/required-test.yml`
- `.github/workflows/unified-brain-delivery.yml`
- existing completion/outcome learning contracts where writeback already belongs

### Added components

- `config/powerhouse-delivery-hygiene-v1.json`: policy only; not a second source of business truth
- `tools/delivery/delivery-hygiene.mjs`: pure decision logic
- `.github/workflows/powerhouse-delivery-hygiene.yml`: cheap admission gate
- `.github/workflows/powerhouse-repository-janitor.yml`: scheduled/manual safe cleanup and evidence
- `.github/workflows/powerhouse-merged-branch-cleanup.yml`: post-merge exact-head branch cleanup for same-repository non-default branches
- focused regression tests under `tests/delivery-hygiene-*.test.mjs` plus branch-cleanup wiring coverage

No new database, external queue, scheduler service or separate learning store is introduced.

## Canonical pull-request metadata

Executable Powerhouse PRs must expose machine-readable metadata in the PR body:

- `Obligation-ID: <canonical-id>`
- `Delivery-Lane: <backend|portal|website|automation|security|incident|dependency|docs>`
- `Candidate-Type: <implementation|recovery|security|dependency|docs|promotion>`
- `Base-SHA: <40-char sha>`
- `Supersedes: <pr-number|none>`

Existing `Change-Scope` and `Scope-Budget` remain supported.

For legacy PRs without metadata, the hygiene gate may classify them as `LEGACY_UNCLASSIFIED`, but may not auto-close them solely for missing metadata.

### Metadata learning from production

`Candidate-Type` is closed over the configured allowed values. A post-merge corrective candidate therefore uses `recovery`, not an invented value such as `corrective`.

`Supersedes` is only valid when the predecessor can be proven inside the current open-candidate set and owns the same obligation. A corrective continuation after a predecessor is already merged/closed uses `Supersedes: none`; historical lineage remains documented in prose/evidence rather than being forced into an invalid active-supersession relation.

## Admission model

The cheap admission gate executes before broad suites and returns one terminal decision:

- `ADMITTED`
- `BLOCKED_DUPLICATE_OBLIGATION`
- `BLOCKED_WIP_LIMIT`
- `BLOCKED_STALE_IDENTITY`
- `BLOCKED_SUPERSEDED`
- `BLOCKED_PROMOTION_SERIALIZATION`
- `BLOCKED_METADATA_INVALID`
- `BLOCKED_LINEAGE_AMBIGUOUS`

For an executable PR with `Obligation-ID=X`, at most one can be active. A successor is admissible only when it explicitly declares `Supersedes` and the predecessor is proven to own the same obligation. The predecessor is not closed until successor identity and lineage pass validation.

Default executable WIP limit: 5 open admitted product/recovery/security/incident PRs repository-wide. Dependency maintenance and non-executable documentation are counted separately. Security and incident recovery have priority but never bypass integrity or test gates.

## Promotion serialization

Only one promotion-eligible candidate may hold promotion authority for overlapping conflict-contract scope at a time. The lease is derived from GitHub-visible canonical state plus exact SHA and conflict-contract membership; there is no new queue. Non-overlapping lanes may proceed when BRAIN conflict logic proves independence.

## CI budgeting

1. docs-only/non-executable changes run cheap contract/documentation checks only;
2. lane-specific changes run selected lane plus mandatory cross-cutting security/governance checks;
3. full repository verification is reserved for promotion-eligible candidates or delivery-control-plane/shared conflict changes;
4. production/readback workflows do not run automatically for ordinary PRs;
5. duplicate/superseded/stale candidates fail before expensive installation/build/test work where technically possible.

`Required test` remains the protected branch aggregator. Hygiene is a precondition, not a competing required-check authority.

## Failure deduplication

A deterministic failure fingerprint maps to one canonical recovery obligation. Existing Powerhouse failure-learning/writeback remains authoritative; GitHub is execution surface only.

## Repository Janitor

The janitor runs scheduled and manually. Default is evidence-first. It may close/mark only deterministic same-obligation supersession, exact linked duplicate lineage, fulfilled obligation with no unique commits, or previously machine-proven superseded state. It never auto-closes by similar title, filenames, age, red CI, branch-name similarity, or inferred prose intent. Ambiguous cases remain open as `REVIEW_REQUIRED`.

Each run emits open PR classification, WIP count, duplicate groups, safe actions, ambiguous candidates, stale promotion state, performed actions and remaining obligations.

## Merged branch cleanup

After a pull request is merged, `Powerhouse Merged Branch Cleanup` handles only same-repository, non-default head branches. It is fail-closed and exact-head bound:

1. read the branch ref with bounded retry for transient provider failures;
2. treat an already-absent branch as an idempotent success;
3. compare the live branch SHA with the merged PR's exact head SHA;
4. block on drift instead of deleting a moved branch;
5. delete only after exact identity passes;
6. read back the ref and require 404 to prove deletion;
7. upload durable cleanup evidence with state, detail, repository, branch, expected head SHA, default branch and exit code.

Default-branch deletion is explicitly forbidden. Fork branches are excluded by the workflow condition. This extends V1 hygiene from PR-state cleanup to safe post-merge branch-state cleanup without weakening branch protection or introducing heuristic deletion.

## Required-test integration

`required-test.yml` has early hygiene before current preflight. Current lane derivation, Supabase security gate, portal suite, selected jobs and final `test` aggregator remain intact. Protected context stays `test`.

## Unified Brain Delivery integration

`unified-brain-delivery.yml` verifies candidate admission before expensive lane execution and again before handoff/promotion. Existing exact-SHA, branch-drift and main-protection checks remain authoritative.

## Backlog recovery

After deployment, run janitor dry-run over all open PRs, classify without mutation, group exact lineages, identify deterministic duplicates/fulfilled work, close only safe superseded candidates, preserve unique/ambiguous work, select one active candidate per obligation, serialize remaining delivery, and write outcome/evidence through existing Powerhouse mechanisms.

## Test strategy

Regression coverage includes single candidate admission, duplicate block, valid/invalid supersession, WIP boundaries, dependency/docs exclusions, stale identity, promotion conflict/non-conflict, docs-only CI budget, janitor dry-run, safe exact cleanup, no heuristic closure, fulfilled obligation with unique commits, stable `test` aggregator, Unified Brain recheck before handoff, exact-head merged branch deletion, default-branch protection, already-absent idempotency and deletion readback.

## Production proof — 2026-09-17

- Corrective PR `#1964` used exact candidate head `a053103d2fda54594dc741f55bf8f2d52785fe3c`.
- Initial admission failed because metadata used unsupported `Candidate-Type: corrective` and non-provable `Supersedes: 1961` after #1961 was already closed/merged.
- Metadata was corrected without changing candidate code/head to `Candidate-Type: recovery` and `Supersedes: none`.
- Required admission then passed, BRAIN admission/plan/all changed lanes/pre-handoff/handoff passed, and final protected `test` passed.
- PR `#1964` was squash-merged with exact expected head into merge commit `986be03a0a0c7c4417a280cb5a09803b65e25937`.
- `main` readback returned that exact merge SHA and remained protected with required context `test`.
- The merged feature branch `fix/powerhouse-delivery-hygiene-v1` subsequently returned Git ref 404, proving branch absence after merge; repository auto-delete was not relied on by this design.

Reusable failure fingerprint: `delivery-hygiene-post-merge-metadata-lineage-contract-v1`.
Prevention rule: metadata values must come from the canonical policy/parser, and active supersession must never point to a predecessor that is already outside the open-candidate set. Historical lineage belongs in evidence/prose unless an explicit closed-predecessor contract is added and tested.

## Acceptance criteria

Complete only when new tests pass, existing delivery/moving-main/branch-hygiene tests stay green, branch protection still requires `test`, duplicate obligation blocks before expensive work, docs-only work avoids broad CI, safe supersession evidence is deterministic, live janitor dry-run classifies without unsafe mutation, merged same-repository branch cleanup is exact-head guarded and read back, WIP/one-candidate rules hold, exact-SHA control-plane promotion is verified, canonical learning/evidence is written back, and no known technically-solvable duplicate-lane blocker remains.

## Rollback

Disable/remove admission, janitor and merged-branch-cleanup wiring while leaving existing Required test, Unified Brain Delivery, branch protection and Powerhouse state untouched. Disabling merged-branch cleanup stops future branch deletion without affecting already-merged code or protected `main`.

## Non-goals

- replacing GitHub merge protection
- creating a separate Powerhouse database or queue
- auto-merging every green PR
- deleting the default branch, fork branches, unmerged branches, or branches whose current SHA differs from the merged PR exact head
- inferring supersession or deletion safety from semantic similarity
- relaxing Supabase/security/quality/release gates
- reducing evidence quality for speed or cost
