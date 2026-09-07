# Risk-based parallel release lanes

Date: 2026-09-07
Status: approved design
Repository: `arthurprinsen-ai/Bedrijfsgeheugen`

## Goal

Reduce lead time from website fix to verified production without weakening production safety. Small, isolated website fixes must be independently testable, mergeable and deployable while unrelated failing work remains isolated.

## Current problem

The repository contains many independent GitHub Actions for page/SEO validation, live preview, shared shell, integrity, regressions and production checks. Small public-site changes can trigger heavyweight validation, including browser installation and broad page/SEO scans. This creates unnecessary latency for low-risk changes and makes the delivery experience feel serial even when work is logically independent.

Production integrity must remain governed: `main` stays protected, production writes stay PR-backed, and post-merge verification must prove that the intended commit is actually live.

## Design principles

1. **Risk determines validation depth.** Tests are selected by blast radius, not by a one-size-fits-all pipeline.
2. **PR isolation is the default.** Every independent change gets its own branch/worktree, PR and concurrency key.
3. **No unrelated blocker propagation.** A failing PR cannot block another independent PR whose own required checks are green.
4. **Shared/global files escalate automatically.** Changes to common shell, navigation, build, redirects, production configuration or release infrastructure may never use the Fast Fix lane.
5. **Production truth is read back.** Merge success is not release success; the exact merged SHA and affected route behaviour must be verified on production.
6. **Fail closed on ambiguity.** If the classifier cannot prove a change is low risk, it must choose Normal or High Risk.

## Release lanes

### 1. Fast Fix

Intended for low-blast-radius changes such as:

- page-local CSS;
- page-local JavaScript interactions;
- copy/text changes;
- local non-structural HTML changes;
- isolated visual fixes that do not alter global shell, metadata contracts or build behaviour.

Fast Fix validation must include:

- diff/risk classification;
- syntax/static contract checks for changed files;
- mapping from changed files to affected public routes;
- Netlify deploy-preview readiness for the exact PR head SHA;
- targeted browser smoke for each affected route;
- desktop and mobile viewport verification;
- no uncaught browser errors and no failed critical resource loads;
- relevant permanent regression test when the fix corrects a recurring failure mode.

Fast Fix must not run the full site-wide page/SEO browser scan unless the classifier escalates the change.

### 2. Normal Change

Used for changes with broader but still bounded impact, including:

- new page sections;
- SEO/content structure changes;
- metadata changes;
- multiple public pages;
- reusable but non-foundational components;
- changes where targeted tests alone cannot prove safety.

Normal validation keeps the relevant page/SEO checks and broader browser/regression coverage.

### 3. High Risk

Mandatory for global or production-critical changes, including at minimum:

- shared site shell or canonical header/footer;
- shared navigation/menu code;
- build/generator tooling;
- `netlify.toml`;
- `_redirects`;
- production promotion tooling;
- CI/release workflow logic;
- global CSS/JS with cross-site blast radius;
- core portal/customer-runtime contracts when shared infrastructure is touched.

High Risk uses the complete relevant regression and production-safety chain.

## Risk classifier

Create one canonical classifier that evaluates the PR diff and emits at least:

- `lane`: `fast-fix | normal | high-risk`;
- `changed_files`;
- `affected_routes`;
- `risk_reasons`;
- `required_test_sets`;
- `escalated`: boolean.

The classifier must be deterministic and covered by unit tests.

### Fast Fix allow rules

A Fast Fix is only allowed when every changed path is explicitly recognised as low risk and no global dependency is touched. Unknown paths always escalate.

Page-local assets must be tied to an explicit route ownership/mapping mechanism; filename guessing alone is insufficient when an asset can be shared.

### Mandatory escalation examples

Any modification to these categories escalates to High Risk unless a narrower existing contract proves otherwise:

- `.github/workflows/**`;
- `netlify.toml`;
- `_redirects`;
- shared shell/navigation assets;
- build/generation tooling under production build paths;
- canonical SEO baseline/configuration;
- files consumed by multiple unrelated public routes.

## GitHub Actions architecture

### Classification workflow

A lightweight PR workflow runs first and produces the lane decision as machine-readable output/artifact/summary.

### Lane-specific required status

Expose one stable required status for branch protection, for example `release-gate`, whose implementation delegates to lane-specific jobs. Branch protection must not require every heavyweight workflow for every PR.

The `release-gate` result is green only when the selected lane's required checks are green.

### Concurrency

PR workflows use a key derived from PR number and workflow purpose, for example:

`<workflow>-pr-<number>`

New commits may cancel obsolete runs for the same PR. Different PRs must not share a concurrency group.

Only operations that can mutate shared repository state or production state may use a serialized shared lock. Validation-only PR jobs must never use the shared `repo-schrijven` lane.

## Netlify preview optimisation

Do not remove preview verification. Optimise it by:

- polling only the current head SHA;
- using the smallest practical poll interval/backoff while respecting API limits;
- failing immediately on explicit Netlify failure/error;
- starting targeted checks as soon as the exact preview is ready;
- avoiding unrelated homepage-only checks when the affected route is elsewhere.

The preview URL and observed commit/status evidence must be written into the workflow summary.

## Targeted browser verification

For each affected public route, Fast Fix must verify at least:

- HTTP success;
- expected page identity marker/title or canonical route identity;
- changed interaction contract where applicable;
- desktop render smoke;
- mobile render smoke;
- no uncaught page exceptions;
- no critical same-origin asset failures;
- no accidental blank/white page state.

Screenshots may be retained as artifacts for traceability, but screenshot creation itself is not sufficient evidence of correctness.

## SEO behaviour

Fast Fix must not skip SEO safety blindly.

If a change does not touch SEO-relevant HTML/head structure, canonical data, navigation/link structure, redirects or shared assets that influence crawlable output, the expensive full SEO scan may be omitted for that PR.

If any SEO-sensitive path or structure changes, the classifier escalates to Normal or High Risk and the existing SEO validation remains applicable.

## Production promotion and readback

After merge to `main`:

1. Observe the merge commit SHA.
2. Wait for Netlify production to report that exact SHA as ready.
3. Verify production responses for the routes affected by the merged PR.
4. Re-run the critical interaction contract for the changed behaviour when applicable.
5. Record immutable evidence containing PR number, merge SHA, production deploy SHA/status, routes checked and result.
6. Only then classify the change as `LIVE_VERIFIED`.

If Netlify serves a different SHA, the release is not complete even when GitHub merge checks passed.

## Main-write integrity

Existing main-write provenance protection remains intact. No Fast Fix workflow may bypass PR-based delivery or write directly to `main`.

Automated repair tooling may produce candidate branches/PRs but cannot silently self-merge around the governed release gate.

## Parallel development contract

Independent changes must be developed in isolated branches/worktrees and separate PRs.

A PR is production-eligible based on:

- current-base compatibility/conflict check;
- its own classifier result;
- its own required lane checks;
- successful preview for its exact head SHA;
- absence of unresolved merge conflicts.

The state of unrelated PRs is not an eligibility condition.

After another PR merges, GitHub/base-change policy may require the candidate to update/rebase and re-run its own lane checks, but it must not inherit unrelated failures.

## Failure handling

- **Classifier ambiguity:** escalate; never downgrade by guesswork.
- **Preview unavailable:** fail the release gate with explicit preview evidence.
- **Targeted browser regression:** fail only that PR and retain diagnostics.
- **Production SHA mismatch:** mark release incomplete and do not claim live success.
- **Post-merge route regression:** create/update a deduplicated incident and route the repair through a new isolated candidate PR.
- **Shared infrastructure failure:** High Risk lane blocks affected candidates, but unrelated Fast Fixes remain independent unless they depend on that infrastructure.

## Test strategy

Implementation must be test-driven and include at least:

1. classifier unit tests for Fast/Normal/High Risk examples;
2. tests proving unknown/shared paths escalate;
3. tests proving two independent PR identifiers create different concurrency groups;
4. tests proving same-PR newer runs may supersede older runs;
5. targeted route derivation tests;
6. release-gate aggregation tests;
7. production readback tests including exact-SHA mismatch failure;
8. regression tests for the previously observed failure class where a change was reported fixed before the live production state matched the intended commit.

## Rollout

Roll out in guarded stages:

1. Add classifier in observation mode; compare lane decisions with existing full pipeline.
2. Add lane-specific jobs while retaining current full checks as non-blocking evidence where practical.
3. Promote `release-gate` to the branch-protection contract after classifier/test evidence is green.
4. Remove redundant blocking from heavyweight workflows only after proving equivalent safety coverage.
5. Enable production readback as the final release truth signal.

This staged rollout prevents a speed optimisation from accidentally creating a safety gap.

## Success criteria

The design is successful when:

- an isolated low-risk visual/interactivity fix can complete without waiting for unrelated full-site regressions;
- independent PRs validate concurrently;
- shared/global changes still receive full coverage;
- no Fast Fix can bypass PR governance or production SHA verification;
- live status is based on exact production readback, not merge assumption;
- the system can explain why a PR received its lane and which routes/tests were selected;
- recurring website defects gain permanent targeted regression coverage.

## Non-goals

- removing branch protection;
- permitting direct production/main writes for speed;
- disabling SEO or browser validation globally;
- treating screenshots as the only validation mechanism;
- automatically classifying unknown changes as low risk.
