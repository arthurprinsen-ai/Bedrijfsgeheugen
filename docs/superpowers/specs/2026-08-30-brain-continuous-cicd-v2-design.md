# BRAIN Continuous CI/CD v2 — Canonical Design

## Status
Canonical architecture decision and implementation specification for continuous delivery across Bedrijfsgeheugen.

This document is the single design reference for the existing `BRAIN-DELIVERY-v2` implementation. It does not introduce a second CI/CD model. It consolidates the architecture already enforced through `AGENTS.md`, `config/brain-delivery-system.json`, `brain/contracts/delivery-v2.schema.json`, `brain/production/continuous-delivery-v2.mjs`, `tools/brain-delivery-system.mjs` and `.github/workflows/unified-brain-delivery.yml`.

## Objective
All apps, agents, Make scenarios, GitHub workflows, website components, portal components, backend services, Notion projections and future connected systems must be able to develop simultaneously, validate independently, promote safely without unnecessary waiting, verify the exact production identity and learn together through one Brain.

The governing principle is:

**independent delivery, shared intelligence**

## Canonical delivery flow

`simultaneous development -> isolate change -> targeted parallel validation -> current-main file + contract drift check -> safe merge/promotion -> exact production identity verification -> outcome measurement -> BG168/BG166 learning writeback -> BG167 shared-state refresh`

There are no release batches by default. A coordinated release is required only when declared contract or dependency atomicity proves that components cannot safely promote independently.

## Non-negotiable invariants

1. `main` may move continuously.
2. Generic `main` drift is never by itself a rebuild, retry or waiting condition.
3. A tested candidate remains valid when subsequent `main` movement is non-overlapping in both changed paths and declared conflict contracts.
4. File overlap, merge conflict or declared semantic contract overlap requires synchronization and revalidation only for the affected lane.
5. A lane promotes only the exact candidate identity that passed its gates.
6. A different SHA, artifact, scenario revision or deployed identity is not green, even if functionally similar.
7. BG169 is the production promotion authority for GitHub-backed production changes.
8. BG167 is the shared current-state context agents read before material execution.
9. BG168 routes material outcomes and learning; BG166 remains the error/incident ledger.
10. Quality, contract/schema, security, cost/performance, preview/runtime, rollback readiness and production verification are mandatory gates.
11. Unknown active delivery scope fails closed before production.
12. New components auto-register into the Brain delivery model and are not production-ready without shared-context read, cost/security governance, rollback identity and learning writeback.
13. Notion is a knowledge, audit and projection layer; it is never the authority for the actually deployed identity.
14. GitHub and Netlify are governed Brain components, not external exceptions to the architecture.
15. Existing Make scenarios are migrated compatibility-first through central contracts/gateways; destructive bulk rewrites are not required merely to conform to v2.

## Delivery lane model

Every material production change is represented as an independent delivery lane with at least:

- `change_id`
- `component_id`
- `lane_id`
- `component_type`
- candidate identity
- tested identity
- rollback identity
- changed scopes
- dependencies
- mandatory gates
- production state
- deployed identity

The machine-readable manifest contract is `BRAIN-DELIVERY-v2`.

The repository delivery policy classifies work into lanes such as backend, portal, website and automation. Shared control-plane changes fan out to all affected governance lanes but do not create one artificial release candidate when the components remain independently promotable.

## Moving-main conflict model

The delivery engine uses two separate conflict indices.

### 1. Changed-path index
The candidate's changed paths are compared with paths introduced on `main` after the candidate's tested base.

- no exact relevant overlap -> keep the exact tested candidate;
- changed-path overlap -> synchronize the affected lane;
- merge conflict -> synchronize the affected lane.

### 2. Semantic contract index
Different files can still change the same interface or schema. Therefore v2 also maps paths to declared conflict contracts. Examples include:

- BRAIN delivery control plane;
- Supabase/database schema contracts;
- Make integration contracts;
- Notion projection contracts;
- DataForSEO integration contracts;
- Netlify deployment/runtime contracts.

If candidate and intervening `main` drift touch the same declared conflict contract, the lane must synchronize and revalidate even when filenames differ.

BG166/BG167/BG168/BG169 are shared governance dependencies, not generic conflict-contract identifiers. Treating them as conflict domains would serialize every lane and violate the independent-delivery invariant.

## Validation strategy

Validation is intentionally layered for speed.

1. Reuse proven delivery-prevention rules before expensive work.
2. Discover changed lanes and Brain membership.
3. Run relevant lane tests in parallel.
4. Preserve the exact tested candidate identity.
5. Immediately before production handoff, evaluate intervening `main` drift against file and semantic contract indices.
6. Continue without rebuild when drift is demonstrably non-conflicting.
7. Synchronize only affected lanes when real overlap exists.
8. Hand exact green identities to BG169.
9. Verify production against the exact promoted identity.

A repository-wide integrated test may still exist as a quality signal, but it may not be used to serialize unrelated production lanes merely because another independent change reached `main` first.

## Production identity and Netlify

For GitHub-backed Netlify production deployment, source identity must be verified before upload:

`node tools/brain-delivery-system.mjs deploy-preflight --sha <exacte-BG169-productie-SHA>`

`DEPLOY_SOURCE_READY` is required. A linked Git worktree that returns `STAGE_STANDALONE_EXACT_SHA` may not be uploaded directly. The production source must be staged as a standalone exact-SHA checkout and preflighted again.

Production is green only after the deployed identity equals the candidate identity and runtime/outcome verification succeeds.

## Failure, recovery and learning

A safe failure is an input to the self-healing loop, not a terminal status.

For every material commit, PR, merge, pipeline, deploy or production failure:

1. capture evidence;
2. determine root cause;
3. fix the smallest causal defect;
4. rerun the relevant gate;
5. restore or retain last-known-good production where necessary;
6. record outcome, root cause, failed attempts, successful fix and prevention rule;
7. route learning through BG168/BG166;
8. refresh BG167 so all agents inherit the new knowledge.

Known proven failures must not be rediscovered from scratch. Active prevention rules are preflight inputs for comparable future work.

## Cost and speed invariants

The architecture optimizes for both reliability and throughput.

- no forced rebuild for non-overlapping `main` drift;
- targeted tests before broad tests;
- parallel lane validation;
- no duplicate expensive scenario logic where central gateways can enforce the same contract;
- cost/performance is a mandatory gate, not a later optimization;
- repeated failures should require less diagnosis because proven prevention is reused;
- future components automatically inherit central delivery, cost, security and learning contracts.

The desired direction is measurable: lower delivery lead time, fewer duplicate retries, fewer avoidable CI minutes/Make operations, lower cost per verified production outcome and fewer repeated failure fingerprints.

## System scope

The v2 contract applies to, at minimum:

- GitHub repositories, PRs, merges and Actions workflows;
- Netlify builds and production deployment;
- backend/services/functions;
- website and portal;
- agents and future agents;
- Make scenarios and orchestration gateways;
- Notion projections and audit state;
- Supabase schema/data contracts;
- DataForSEO and other external integrations;
- future apps or services registered into the Brain.

A future system is not exempt because it uses a different runtime or vendor. It must map its candidate identity, tested identity, dependencies, rollback identity, gates, outcome verification and learning writeback into the same lifecycle vocabulary.

## Source of truth hierarchy

When sources disagree, use this order:

1. exact verified production/runtime evidence for what is actually live;
2. machine-enforced `BRAIN-DELIVERY-v2` contracts and policy on current `main`;
3. `AGENTS.md` operating contract;
4. this canonical design specification;
5. rollout plans and historical implementation notes;
6. Notion/human-facing projections.

The design and implementation must be brought back into alignment whenever a lower layer becomes stale. No chat or separate document may create a competing production truth.

## Definition of done for a delivery lane

A lane is done only when all of the following are true:

- the change is registered and classified;
- relevant tests/gates are green;
- candidate identity equals tested identity;
- intervening `main` drift has no unresolved file or semantic contract conflict;
- rollback identity exists;
- production promotion used the exact approved candidate identity;
- deployed identity is verified;
- runtime/business outcome is verified;
- material outcome/error/learning is persisted through the Brain;
- shared current state is refreshed for subsequent agents.

A green merge, successful GitHub Action or HTTP 2xx alone is not sufficient.

## Architecture decision

There is one BRAIN Continuous CI/CD architecture.

The earlier BRAIN CI/CD architecture defines the original direction; `BRAIN-DELIVERY-v2` is its machine-enforced implementation. GitHub, Netlify and all connected systems participate in that same architecture. New delivery behavior must extend these contracts rather than introduce a parallel CI/CD path, separate source of truth or release process.
