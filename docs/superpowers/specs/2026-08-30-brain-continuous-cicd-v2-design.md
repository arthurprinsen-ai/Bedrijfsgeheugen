# BRAIN Continuous CI/CD v2 — Architecture Design

## Status
Approved architectural direction: every safe change is independently releasable and is promoted to `main` and production as soon as its own gates are green. No batching or waiting for unrelated work.

## Goal
Make Bedrijfsgeheugen one continuously delivering Brain in which website, portal, backend, Netlify functions, GitHub workflows, Make scenarios, agents and every current/future app can all be developed simultaneously without being blocked merely because `main` has advanced.

The governing loop is:

**change → isolate or validate natively → classify → test in parallel → reconcile real overlap only → promote immediately → verify exact production/external state → measure → learn → shared memory**

## Core invariants
1. `MAIN MAY MOVE; SAFE WORK MUST CONTINUE`.
2. `NO REBUILD FOR NON-OVERLAPPING MAIN DRIFT`.
3. `SMALLEST SAFE CHANGE RELEASES IMMEDIATELY`.
4. `UNRELATED WORK NEVER WAITS`.
5. `EXACT MERGE/DEPLOY/EXTERNAL OUTCOME IS REQUIRED`.
6. `GREEN MEANS PRODUCTION OUTCOME VERIFIED`.
7. `ONE BRAIN, ONE SHARED CONTEXT, ONE PRODUCTION AUTHORITY`.
8. `FAILURE IS ISOLATED; LAST-KNOWN-GOOD STAYS AVAILABLE`.
9. `EVERY MATERIAL OUTCOME BECOMES SHARED LEARNING`.
10. `NEW APPS, AGENTS AND SCENARIOS INHERIT THIS CONTRACT AUTOMATICALLY`.
11. `NO APP IS A DELIVERY ISLAND`.
12. `NO BATCHING WITHOUT A REAL DEPENDENCY`.

## Moving-main and concurrency model
`main` is expected to change continuously. `behind_by > 0` is never itself a failure condition.

A feature branch is synchronized only when proven relevant overlap exists: merge conflict, changed-path overlap with semantic impact, shared API/schema/state/route/invariant overlap, or equivalent work already landed and requiring dedupe.

Without relevant overlap, the tested feature head remains valid and merges against current `main`; the resulting merge SHA becomes the production candidate.

Short-lived isolation branches are preferred for Git-backed code/config changes. They exist to protect `main`, not to queue releases. Branch lifetime should normally be minutes.

Bounded multi-file changes prefer one atomic Git tree/commit rather than serial file-by-file replay.

## Universal continuous promotion
The release unit is the smallest independently safe change. There are no release batches for unrelated work.

For Git-backed changes:
**change → short-lived isolation → relevant CI → conflict-index check → merge immediately to current `main` → immediate production promotion → exact production verification → BG168 learning → BG167 refresh**.

For external systems without Git branch semantics:
**change intent → validate contract/idempotency/security/cost → apply smallest safe production mutation → verify real external outcome → BG168 learning → BG167 refresh**.

No manual release button is required for ordinary safe changes.

## Universal app/platform scope
The architecture applies to all current and future connected systems. Seed inventory includes GitHub, Netlify, Make, Notion, Supabase, DataForSEO, Canva, HeyGen, Windsor.ai, Google Drive/Docs/Sheets/Calendar/Gmail/Contacts, LinkedIn, Meta/Instagram, AI/model services, website, portal, backend, APIs, functions and future connectors.

The inventory is deliberately non-exhaustive. Any newly connected app automatically inherits the Brain delivery contract through a platform adapter.

Every adapter exposes: app/component identity, owner, change/idempotency identity, dependency/contract keys, validation evidence, production mutation/deploy identity, outcome evidence, rollback/recovery, cost class, security class, hard-boundary flags and material-outcome writeback.

No platform may maintain an isolated release truth or unrelated batching queue.

## Brain control plane
- **BG167**: current shared context, active dependency/concurrency state and latest learning projection.
- **BG168**: material outcomes, incidents, recoveries, patterns and reusable learning.
- **BG169**: sole production promotion/rollback authority where a central promotion step exists.

Logical functions inside the Brain delivery tooling:
- Change Registry;
- Conflict Index;
- Continuous Promotion Controller;
- Platform Adapter Registry;
- Learning/Failure Fingerprint Index.

## Conflict Index states
- `NO_RELEVANT_DRIFT`: unrelated changes; continue without sync.
- `DUPLICATE_ALREADY_LANDED`: reuse/dedupe; do not repeat.
- `PATH_OVERLAP_SAFE`: same broad area but proven independent.
- `CONTRACT_OVERLAP`: reconcile/retest affected contract only.
- `MERGE_CONFLICT`: reconcile affected files only.
- `HARD_BOUNDARY`: stop only affected action.

## Platform-specific direct-release semantics
Direct release never means blind write. It means no artificial waiting after the platform-specific safety gate passes.

- Supabase: validate compatibility/migration → apply safe change → read back schema/runtime proof → learn.
- Notion: validate database/property/idempotency contract → write via proven connector → read back target state → learn.
- DataForSEO: validate request and cost budget → activate immediately → verify evidence/downstream outcome → learn.
- Make: atomic scenario patch → validate → activate immediately when green → verify execution outcome → learn.
- Canva/HeyGen: validate template/input and paid-action boundaries → generate/publish within approved autonomy → verify asset/outcome → learn.
- GitHub/Netlify: exact feature/merge/deploy identity and production evidence required.

## CI/CD coverage
Only affected lanes should run; unaffected lanes must not create waiting. Mandatory gates are derived from the change envelope and shared contracts. A generic green workflow is insufficient if the domain-specific regression gate did not execute.

## Learning architecture
Chat output is not ephemeral. Proven architecture decisions, failure fingerprints, root causes, failed approaches, fixes, regression contracts, production evidence, cost/performance lessons and hard boundaries are written to:
- `docs/brain/chat-to-brain-learning-contract.md`;
- `docs/brain/delivery-failure-lessons.json`;
- domain ledgers/contracts as needed;
- BG168 material learning;
- BG167 current shared context.

New chats/agents/scenarios read this before material development work and dedupe against existing fingerprints.

## Failure isolation and recovery
A red candidate blocks only itself and true dependents. Unrelated green work continues.

Production remains last-known-good. Retries are bounded and hypothesis-driven. Revert/rollback targets the smallest offending change where safe. Material errors and recoveries are written back as reusable learning.

## Hard boundaries
Automatic CI/CD must not autonomously change secrets/credentials/permissions, weaken security controls, perform irreversible/destructive mutations, increase paid external resources, or execute legally/financially binding actions.

A hard boundary blocks only the affected action, not unrelated development.

## Acceptance criteria
Implementation is complete when:
- multiple independent changes can build/release while `main` advances;
- non-overlapping main drift never triggers rebuild merely to reach `behind_by=0`;
- green changes merge/deploy individually without waiting;
- actual overlap triggers bounded reconciliation only;
- all current/future apps inherit platform-adapter delivery semantics;
- exact production/external outcome is verified for every material release;
- failed changes do not block unrelated green releases;
- BG167 exposes current concurrency/learning state;
- BG168 receives merge/deploy/failure/recovery/app learning;
- domain CI fails closed when required tests are missing;
- branch rebuilds caused solely by unrelated drift remain zero;
- duplicate-work and delivery cost trend downward without weakening correctness.

## Canonical supporting contracts
- `docs/brain/chat-to-brain-learning-contract.md`
- `docs/brain/universal-app-delivery-scope.md`
- `docs/brain/delivery-failure-lessons.json`
- `docs/development-operating-system.md`
- `AGENTS.md`

At no point is a proven working production path removed before its replacement has verified production outcome evidence.
