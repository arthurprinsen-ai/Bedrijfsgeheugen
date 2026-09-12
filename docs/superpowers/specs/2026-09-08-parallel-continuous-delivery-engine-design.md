# Parallel Continuous Delivery Engine — Design

**Date:** 2026-09-08
**Repository:** `arthurprinsen-ai/Bedrijfsgeheugen`
**Status:** Approved architecture, implementation pending

## 1. Goal

Build a delivery control plane that allows many independent changes to be developed, tested, merged, deployed, and verified in parallel without long-lived branch drift, scope pollution, unnecessary full-suite reruns, or production ambiguity.

The system must make small releases stay small, let unrelated work proceed independently, and preserve fail-closed safety for overlapping or high-risk work.

## 2. Success criteria

A successful implementation satisfies all of the following:

1. A two-file website fix cannot silently grow into dozens of unrelated files because `main` moved.
2. Independent website, portal, backend, automation, Brain, SEO, and content changes can execute CI concurrently.
3. A non-overlapping change does not require repeated rebases or successor branches just because `main` advanced.
4. Overlapping changes are detected by changed-path overlap, declared contract overlap, merge conflict, or declared dependency conflict.
5. Only affected delivery lanes and risk-appropriate test suites run.
6. Stale CI for the same change is cancelled automatically, while production promotion is never cancelled halfway through.
7. Merge-queue candidates are tested against their actual merge-group state before entering `main`.
8. Required workflows support both `pull_request` and `merge_group` events.
9. The exact tested candidate SHA/artifact is what is promoted to production; no unverified rebuild is substituted.
10. Production completion requires exact-SHA deploy evidence plus live functional readback.
11. Failed production readback creates a deterministic recovery obligation and never counts as completed delivery.
12. CI runtime is reduced by caching dependency/runtime layers and avoiding repeated installation work where safe.
13. Control-plane changes themselves remain high-risk and fail closed.
14. Branch/release hygiene rules prevent accidental scope growth and cross-change contamination.

## 3. Current baseline

The repository already contains important building blocks:

- `Required test` delegates to reusable backend, portal, automation, and website release lanes.
- `config/brain-delivery-system.json` classifies changed paths into independent delivery lanes.
- `scripts/brain/moving-main-successor-guard.mjs` distinguishes ordinary non-overlapping drift from real synchronization requirements.
- `lane-website.yml` already distinguishes `fast-fix`, normal, and high-risk website work.
- Production authority and exact-SHA requirements are already represented in the Brain delivery configuration.

The new design extends these capabilities instead of replacing them.

## 4. Architectural principles

### 4.1 Immutable change candidates

Every requested change is created from the current `main` and owns a bounded changeset. Ordinary non-overlapping movement of `main` must not mutate or rebuild that candidate.

A candidate may be synchronized only when one of these conditions is proven:

- merge conflict;
- changed-path overlap;
- declared-contract overlap;
- declared-dependency conflict.

If none applies, the tested candidate remains valid and proceeds independently.

### 4.2 Scope ownership contract

Each change receives a machine-readable scope manifest containing:

- change identifier;
- base SHA;
- owned paths;
- affected lanes;
- affected contracts;
- risk class;
- expected production surfaces;
- allowed generated files;
- dependency declarations.

CI compares the actual PR diff with this manifest. Unexpected files fail the scope guard unless explicitly added by a reviewed scope amendment.

The guard must detect:

- unexpected changed files;
- cross-change commit contamination;
- generated files outside the allowlist;
- hidden control-plane expansion;
- branch growth beyond configurable thresholds.

Thresholds are diagnostics, not the primary rule. A small legitimate change may exceed a count if its declared scope allows it; an undeclared single file is still a violation.

### 4.3 Parallel lane DAG

The delivery planner produces a directed acyclic graph rather than a monolithic test decision.

Primary lanes:

- `website`;
- `portal`;
- `backend`;
- `automation`;
- `brain-control-plane`;
- `seo`;
- `content`.

A changed path may activate one or more lanes. Shared configuration must no longer mean automatically running every product lane. Shared paths are classified by explicit contract impact.

Examples:

- `.github/canoniek/kop.html` → website + shell contract;
- `portal-v2/**` → portal;
- Supabase migration → backend + database contract;
- `config/brain-delivery-system.json` → brain-control-plane and any explicitly affected lane contracts;
- SEO measurement functions → SEO + backend only when runtime code is involved.

### 4.4 Risk-adaptive gates

Each lane has three risk classes:

- `fast-fix`: targeted static/unit/contract checks plus targeted preview readback;
- `normal`: lane baseline + targeted browser/integration coverage;
- `high-risk`: broad regression + cross-contract verification + stricter production readback.

Risk is derived from paths, contracts, public-route impact, auth/data impact, and runtime ownership. Agents cannot arbitrarily downgrade risk.

### 4.5 Merge queue compatibility

Required workflows support `merge_group` in addition to `pull_request`.

The merge queue becomes the compatibility boundary for a busy `main`:

- PR CI proves the isolated candidate;
- merge-group CI proves the candidate combined with the actual latest `main` and earlier queued changes;
- only a green merge group may merge.

This removes the need to continuously rebase independent PRs merely because `main` advanced.

### 4.6 Build once, promote exact candidate

The system records a release manifest for each candidate containing:

- source PR/change id;
- candidate SHA;
- merge-group SHA where applicable;
- produced artifact identity;
- checksums;
- lane results;
- risk class;
- deploy target;
- expected live routes/endpoints.

Promotion must use the verified artifact or deterministic exact-SHA build output associated with that release manifest. A later unverified source state may not be substituted.

### 4.7 Deployment serialization only where needed

CI is maximally parallel. Production promotion uses a keyed deployment lock derived from production surface.

Examples:

- independent website and portal deployments may run concurrently only if the deployment platform and artifact model guarantee non-destructive composition;
- two changes that publish the same Netlify site artifact are serialized at final promotion even if their CI ran in parallel;
- independent external automation deployments use separate locks;
- database migrations are serialized under the database schema lock.

The lock applies only to the irreversible/promotion phase, not to build and test.

### 4.8 Concurrency and stale-run cancellation

Every PR/change gets a unique CI concurrency group. New commits cancel older CI runs for that same change.

Production promotion uses a separate concurrency group with `cancel-in-progress: false` so an in-progress deployment/readback cycle cannot be abandoned halfway.

Merge-group runs use their own group keyed to merge-group identity.

### 4.9 Cached CI runtime

CI caches safe reusable dependencies and runtime assets, including where applicable:

- Node package cache;
- Python package cache;
- Playwright browser binaries;
- deterministic generated build dependencies.

Cache keys include lockfile/runtime versions and architecture. Test outputs and mutable production artifacts are never trusted as generic dependency cache.

Where multiple lane jobs need the same heavyweight prepared runtime, use a reusable preparation job/artifact only when its inputs are immutable and checksum-addressed.

### 4.10 Production readback contract

A change is not complete at merge or deploy.

Required completion flow:

`candidate → CI green → merge-group green → merge → deploy exact release → exact-SHA evidence → live readback → outcome verification → learning/prevention`

Readback is lane-specific:

- website: public route render, canonical/navigation contract, key interaction checks;
- portal: production route/module/readiness checks;
- backend: endpoint contract and capability-state checks without secrets;
- automation: execution proof and expected side effect;
- database: schema/version readback;
- Brain: durable outcome/learning writeback when the canonical writeback path is available.

### 4.11 Automatic recovery obligation

When deployment succeeds but live readback fails:

- mark release as `PRODUCTION_READBACK_FAILED`;
- create one deduplicated recovery obligation;
- retain exact release evidence;
- classify rollback versus fix-forward based on blast radius and reversibility;
- execute the safe recovery path;
- rerun production readback;
- close only after recovery evidence is green.

No repeated blind retry loops are allowed.

## 5. Control-plane components

### 5.1 Change manifest

New canonical schema and generator:

- `config/change-scope.schema.json`
- `tools/delivery/change-scope.mjs`

Core interface:

```js
createChangeScope({ changeId, baseSha, changedPaths, policy })
```

Returns an immutable manifest with paths, lanes, contracts, risk, locks, and expected production surfaces.

### 5.2 Scope guard

New guard:

- `tools/delivery/change-scope-guard.mjs`

Core interface:

```js
evaluateChangeScope({ manifest, actualChangedPaths, commitMetadata, policy })
```

Returns `{ ok, violations, diagnostics }` and fails CI when `ok === false`.

### 5.3 Delivery DAG planner

Extend/refactor `tools/brain-delivery-system.mjs` so lane selection is based on explicit impact edges rather than broad `sharedPaths` fan-out.

Core output:

```js
{
  nodes: [{ id, kind, risk, required }],
  edges: [{ from, to, reason }],
  locks: [],
  contracts: [],
  productionSurfaces: []
}
```

### 5.4 Merge-group event adapter

Add one adapter used by required workflows to normalize event context for both PR and merge-group execution.

Proposed file:

- `tools/delivery/github-event-context.mjs`

It returns base/head/change identity without PR-only assumptions.

### 5.5 Release manifest

New immutable evidence object:

- `config/release-manifest.schema.json`
- `tools/delivery/release-manifest.mjs`

The release manifest binds tested source, artifacts, merge-group compatibility, promotion, and readback evidence.

## 6. Workflow architecture

### 6.1 Required test

`.github/workflows/required-test.yml` must:

- trigger on both `pull_request` and `merge_group` for `main`;
- normalize event context through the new event adapter;
- validate the change scope;
- derive only affected lane nodes;
- call reusable lane workflows in parallel;
- aggregate only selected required results;
- preserve the stable required status identity `test`.

### 6.2 Reusable lanes

Reusable lane workflows remain independent and receive immutable inputs:

- candidate SHA;
- base SHA;
- risk class;
- affected routes/resources;
- change id;
- release-manifest id.

They must not infer mutable branch state after classification.

### 6.3 Promotion workflow

Create or evolve one production promotion orchestrator that:

1. resolves the exact merged candidate/release manifest;
2. acquires only the necessary production-surface lock;
3. promotes the exact artifact/SHA;
4. performs readback;
5. records outcome evidence;
6. opens a deterministic recovery obligation on failure.

Promotion jobs use `cancel-in-progress: false`.

## 7. Repository governance

The target GitHub governance is:

- protected `main`;
- required `test` status;
- merge queue enabled when supported by repository settings;
- no direct unverified production writes;
- automatic deletion of merged short-lived branches where repository policy permits;
- no requirement to update a branch with unrelated `main` drift before merge queue validation;
- required workflow execution on merge-group events;
- force pushes to protected main disabled;
- conversation/review requirements kept compatible with autonomous agent operation.

Because repository administration endpoints may not be writable through the current integration, implementation must distinguish code/config changes we can commit from repository settings that require an authorized GitHub admin action.

## 8. Performance targets

Targets are operational objectives, not correctness gates:

- fast-fix PR feedback: mostly targeted checks, no broad browser suite;
- independent lane start delay: minimal queueing under available runner capacity;
- stale CI cancellation: automatic for superseded commits of the same change;
- zero repeated successor creation for non-overlapping main drift;
- zero accidental cross-change file contamination tolerated;
- maximum parallelism limited by runner capacity rather than artificial repository-wide locks.

## 9. Migration strategy

Implement incrementally so existing releases keep working:

1. introduce event-context normalization and merge-group-compatible Required test;
2. introduce scope manifest + guard in audit mode, then enforce;
3. split shared-path fan-out into explicit Brain/control-plane impact edges;
4. add release manifest and exact-artifact promotion evidence;
5. add keyed production locks and recovery obligations;
6. add dependency/runtime caching;
7. enable repository merge queue/rules after merge-group CI is proven green;
8. remove obsolete moving-main successor patterns only after equivalent protections are covered by tests.

Each step must be independently releasable and reversible.

## 10. Regression contract

The implementation must include tests proving at least these scenarios:

1. Website-only change activates website and required shared control checks, not backend/portal/automation.
2. Portal-only change activates portal only.
3. Canonical shell change activates website shell contracts without triggering unrelated backend suites.
4. Explicit Brain delivery policy change activates Brain control-plane checks and only declared impacted lanes.
5. Non-overlapping main drift returns `KEEP_TESTED_FEATURE`.
6. Changed-path overlap returns `SYNC_REQUIRED`.
7. Undeclared file in a change fails the scope guard.
8. Merge-group event resolves a valid base/head identity without PR-only fields.
9. PR and merge-group executions produce the same lane classification for the same effective diff.
10. Stale PR CI may be cancelled; promotion CI cannot be cancelled in progress by a newer release.
11. Release manifest rejects mismatched SHA/artifact evidence.
12. Production readback failure creates exactly one deduplicated recovery obligation.
13. Cached runtime keys change when runtime/lockfile version changes.
14. A busy `main` receiving unrelated commits does not cause successor-branch creation.

## 11. Non-goals

This project does not:

- remove safety gates;
- bypass branch protection;
- make all changes fast-fix;
- allow overlapping database or production writes concurrently;
- trust branch names as release identity;
- treat deploy success as production success;
- repeatedly rebase every open PR to mimic a merge queue.

## 12. Rollout acceptance

The new delivery engine is accepted only after a controlled parallel-release exercise demonstrates:

- at least one website change and one portal/backend change progressing concurrently;
- no scope contamination between them;
- independent CI lane execution;
- merge-group validation against a moving `main`;
- successful production promotion of exact release identities;
- live readback for each change;
- no unnecessary successor branch/rebuild caused by unrelated main movement.
