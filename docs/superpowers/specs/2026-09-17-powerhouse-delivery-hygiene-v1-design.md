# POWERHOUSE-DELIVERY-HYGIENE-v1

Date: 2026-09-17
Status: Approved design, implementation not started
Base main SHA: 6c71a2d3f741d2a4959fe53470ee0be641da2015

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

### Duplicate obligation rule

For an executable PR with `Obligation-ID=X`, query open executable PRs for the same exact canonical obligation. At most one can be active. A successor is admissible only when it explicitly declares `Supersedes` and the referenced predecessor has the same obligation or an explicitly linked predecessor obligation recorded by canonical delivery lineage.

The predecessor is not closed until successor identity and lineage pass validation.

### Repository WIP limit

Default executable WIP limit: 5 open admitted product/recovery/security/incident PRs repository-wide.

The following are counted separately and do not consume the normal product WIP budget:

- dependency maintenance
- non-executable documentation-only work

Security and incident recovery are priority lanes. They may pre-empt admission of new normal product work, but they do not bypass integrity or test gates.

WIP values live in `config/powerhouse-delivery-hygiene-v1.json` and are covered by regression tests.

## Promotion serialization

Only one promotion-eligible candidate may hold the promotion lease for a conflicting contract scope at a time.

The lease is derived from GitHub-visible canonical state, not a new queue. It is represented by candidate metadata/status plus exact SHA and conflict-contract membership. A newer candidate cannot enter production-like promotion verification while an admitted candidate with overlapping conflict contracts is still in a non-terminal promotion state.

Non-overlapping lanes may continue in parallel when existing BRAIN conflict logic proves independence.

## CI budgeting

The hygiene gate must complete before expensive workflow fan-out.

Rules:

1. docs-only/non-executable changes run only cheap contract and documentation checks.
2. lane-specific changes run only their selected lane plus mandatory cross-cutting security/governance checks.
3. full repository verification is reserved for promotion-eligible candidates or changes touching the delivery control plane/shared conflict contracts.
4. production/readback workflows must not run automatically for every ordinary PR; they run only from explicit promotion authority or existing production triggers.
5. duplicate/superseded/stale candidates must fail before package install, large Node suites, preview deploys or production-like checks whenever possible.

Existing `Required test` remains the protected branch aggregator. Delivery Hygiene becomes an input/precondition, not a competing required-check authority.

## Failure deduplication

A deterministic failure fingerprint maps to one canonical recovery obligation. If an open recovery candidate already owns that fingerprint/obligation, new agents must reuse that lineage rather than create another independent candidate.

The design reuses existing Powerhouse failure-learning/writeback. GitHub is an execution surface, not the canonical learning database.

## Repository Janitor

The janitor runs on schedule and via manual dispatch. Its default mode is evidence-first.

### Safe automatic actions

It may mark/close a PR only when at least one of these deterministic proofs is true:

1. PR explicitly declares `Supersedes: N` and validated successor lineage proves same obligation.
2. candidate head SHA/content is an exact duplicate of the canonical successor candidate and predecessor is explicitly linked.
3. canonical obligation is already `FULFILLED` and the PR contains no unique commits absent from fulfilled lineage.
4. PR was previously machine-marked superseded by the hygiene contract and no ambiguity remains.

### Never auto-close on

- similar title
- overlapping filenames alone
- age alone
- red CI alone
- branch name similarity
- inferred intent from prose

Ambiguous cases are emitted as `REVIEW_REQUIRED` evidence and remain open.

### Cleanup outputs

Each run produces structured evidence containing:

- observed open PRs
- obligation/candidate classification
- WIP count
- duplicate groups
- safe supersession actions
- ambiguous candidates
- stale promotion state
- cleanup actions performed
- remaining obligations

## Required-test integration

`required-test.yml` will add an early hygiene job or invoke the reusable hygiene workflow before current preflight. Current lane derivation, Supabase security gate, portal suite, selected lane jobs and final `test` aggregator remain intact.

The protected status context stays `test`. A hygiene failure therefore blocks merge through the existing required check rather than adding branch-protection fragmentation.

## Unified Brain Delivery integration

`unified-brain-delivery.yml` will verify that the candidate is still the admitted canonical candidate before expensive lane execution and again before handoff/promotion. This prevents a candidate that became superseded after initial PR admission from continuing to production authority.

Current exact-SHA, branch-drift and main-protection checks remain authoritative.

## Backlog recovery

After deployment, run the janitor in dry-run mode over all currently open PRs.

Sequence:

1. classify every open PR without mutating it;
2. group exact obligation/supersession lineages;
3. identify deterministic duplicates and already-fulfilled work;
4. close only safe superseded candidates;
5. preserve unique or ambiguous work;
6. choose one active candidate per remaining canonical obligation;
7. bring candidates through serialized delivery against current main;
8. write cleanup outcome and remaining obligations back through existing Powerhouse learning/evidence channels.

The initial cleanup must not bulk-close old PRs by age or title.

## Test strategy

Minimum regression coverage:

1. one obligation with one candidate => admitted;
2. second active candidate for same obligation => blocked;
3. explicit valid successor => successor admitted, predecessor eligible for safe supersession;
4. invalid cross-obligation `Supersedes` => blocked;
5. repository WIP below/equal/above limit;
6. dependency/docs exclusions from product WIP;
7. stale declared base/candidate identity => blocked where policy requires freshness;
8. overlapping promotion contract => serialized;
9. non-overlapping contract scopes => parallelism retained;
10. docs-only change => expensive lanes not selected;
11. janitor dry-run mutates nothing;
12. janitor exact proof can close safe superseded candidate;
13. similar title/path without lineage never auto-closes;
14. fulfilled obligation with unique unmerged commits remains review-required;
15. Required test retains final `test` aggregator semantics;
16. Unified Brain Delivery rechecks admission before handoff.

## Acceptance criteria

The implementation is complete only when:

1. all new delivery-hygiene tests pass;
2. existing delivery, branch-hygiene, moving-main, Required-test and Brain-delivery tests remain green;
3. branch protection still requires the stable `test` context;
4. an intentionally duplicated obligation is blocked before expensive lane work;
5. a docs-only candidate does not trigger broad delivery work;
6. a valid successor produces deterministic supersession evidence;
7. janitor dry-run over the live repository produces a complete classification without unsafe mutations;
8. approved safe cleanup actions are executed and read back from GitHub;
9. remaining active candidates respect WIP and one-candidate-per-obligation rules;
10. production promotion/readback for the control-plane change is exact-SHA verified;
11. learning/evidence is written back through existing canonical Powerhouse mechanisms;
12. final status includes repository hygiene evidence and no known technically-solvable duplicate-lane blocker.

## Rollback

The hygiene policy is additive to existing protected delivery. Rollback consists of disabling/removing the admission and janitor workflow wiring while leaving existing Required test, Unified Brain Delivery, branch protection and Powerhouse state untouched. The janitor must never perform destructive branch deletion as part of v1, so rollback cannot lose unique code.

## Non-goals

- replacing GitHub merge protection
- creating a separate Powerhouse database or queue
- auto-merging every green PR
- deleting branches automatically in v1
- inferring supersession from semantic similarity
- relaxing Supabase/security/quality/release gates to reduce CI load
- reducing evidence quality for speed or cost
