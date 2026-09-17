# POWERHOUSE-DELIVERY-HYGIENE-v1

Date: 2026-09-17
Status: Approved design
Base main SHA: fb0c1684dc9697df55ec831ff4dff70c126ce46c

## Problem

The repository already has strong delivery primitives: change-lane classification, branch hygiene, conflict contracts, SHA-specific concurrency, protected main, production/readback checks and canonical Powerhouse learning. The missing layer is repository-wide admission control. Multiple agents can still create overlapping or successor pull requests for the same obligation, broad workflow fan-out can start before a candidate is proven admissible, moving-main churn multiplies verification work, and superseded candidates can remain open and continue consuming CI capacity.

The objective is to make one canonical delivery lineage the only active execution path for each obligation while preserving existing security, integrity, release and evidence gates.

## Design principles

1. EXISTING-STATE-FIRST: extend BRAIN-DELIVERY-v2 and current GitHub workflows; do not introduce a second delivery brain, database or queue.
2. REUSE-FIRST: reuse current lane classification, conflict contracts, branch hygiene and completion/readback contracts.
3. FAIL-CLOSED: ambiguous ownership, duplicate active candidates, unsafe supersession or stale promotion identity block expensive execution rather than guessing.
4. ONE OBLIGATION, ONE ACTIVE CANDIDATE: there may be historical candidates, but only one executable candidate per canonical obligation.
5. CHEAP BEFORE EXPENSIVE: repository admission and scope checks run before broad test, build, preview or production-like work.
6. DETERMINISTIC CLEANUP: automated closing is allowed only with explicit or machine-provable lineage. Heuristic similarity never closes potentially unique work.
7. LIVE & BEWEZEN INCLUDES HYGIENE: closure is incomplete while superseded delivery state remains open or canonical lineage disagrees between GitHub and Powerhouse.

## Scope

### Existing components to extend

- `config/brain-delivery-system.json`
- `tools/delivery-branch-hygiene-guard.mjs`
- `tools/brain-delivery-system.mjs` and/or a focused delivery-hygiene module under `tools/delivery/`
- `.github/workflows/required-test.yml`
- `.github/workflows/unified-brain-delivery.yml`
- existing completion/outcome learning contracts where writeback already belongs

### New components

- `config/powerhouse-delivery-hygiene-v1.json`: policy only; not a second source of business truth
- `tools/delivery/delivery-hygiene.mjs`: pure decision logic
- `.github/workflows/powerhouse-delivery-hygiene.yml`: cheap admission gate
- `.github/workflows/powerhouse-repository-janitor.yml`: scheduled/manual safe cleanup and evidence
- focused regression tests under `tests/delivery-hygiene-*.test.mjs`

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

## Required-test integration

`required-test.yml` gets early hygiene before current preflight. Current lane derivation, Supabase security gate, portal suite, selected jobs and final `test` aggregator remain intact. Protected context stays `test`.

## Unified Brain Delivery integration

`unified-brain-delivery.yml` verifies candidate admission before expensive lane execution and again before handoff/promotion. Existing exact-SHA, branch-drift and main-protection checks remain authoritative.

## Backlog recovery

After deployment, run janitor dry-run over all open PRs, classify without mutation, group exact lineages, identify deterministic duplicates/fulfilled work, close only safe superseded candidates, preserve unique/ambiguous work, select one active candidate per obligation, serialize remaining delivery, and write outcome/evidence through existing Powerhouse mechanisms.

## Test strategy

Regression coverage must include single candidate admission, duplicate block, valid/invalid supersession, WIP boundaries, dependency/docs exclusions, stale identity, promotion conflict/non-conflict, docs-only CI budget, janitor dry-run, safe exact cleanup, no heuristic closure, fulfilled obligation with unique commits, stable `test` aggregator, and Unified Brain recheck before handoff.

## Acceptance criteria

Complete only when new tests pass, existing delivery/moving-main/branch-hygiene tests stay green, branch protection still requires `test`, duplicate obligation blocks before expensive work, docs-only work avoids broad CI, safe supersession evidence is deterministic, live janitor dry-run classifies without unsafe mutation, safe cleanup is read back, WIP/one-candidate rules hold, exact-SHA control-plane promotion is verified, canonical learning/evidence is written back, and no known technically-solvable duplicate-lane blocker remains.

## Rollback

Disable/remove admission and janitor wiring while leaving existing Required test, Unified Brain Delivery, branch protection and Powerhouse state untouched. V1 never deletes branches automatically.

## Non-goals

- replacing GitHub merge protection
- creating a separate Powerhouse database or queue
- auto-merging every green PR
- deleting branches automatically in v1
- inferring supersession from semantic similarity
- relaxing Supabase/security/quality/release gates
- reducing evidence quality for speed or cost
