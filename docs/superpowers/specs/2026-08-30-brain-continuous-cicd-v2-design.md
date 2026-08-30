# BRAIN Continuous CI/CD v2 — Canonical Architecture

Status: canonical
Architecture ID: `BRAIN-DELIVERY-v2`
Canonical rule: `independent delivery, shared intelligence`

## Purpose

This document is the single canonical bridge between the earlier CI/CD architecture and the BRAIN CI/CD architecture. They are not separate systems, roadmaps, or delivery policies. They are two views of the same operating model:

- CI/CD defines how an isolated change is validated, merged, deployed, verified, rolled back, and recovered.
- BRAIN defines how every app, agent, workflow, scenario, platform, error, fix, cost signal, opportunity, and production outcome shares context and learning.

No chat, agent, workflow, scenario, app, service, or future design may introduce a competing CI/CD truth. If a later proposal conflicts with this document, this document and the machine-readable contracts under `config/` and `brain/contracts/` win until they are deliberately changed together.

## One canonical delivery flow

Every safely automatable change follows the same lifecycle:

`signal -> shared-context read -> owner/lane assignment -> scope + dependency resolution -> candidate build -> impacted tests in parallel -> contract/security/cost/performance gates -> preview/runtime verification -> current-main conflict/dependency check -> exact-candidate promotion -> production verification -> learning writeback -> shared-context refresh`

A change is not done at merge, build success, deploy success, HTTP 2xx, Make success, or workflow success. It is done only when the intended production outcome is verified for the exact candidate identity.

## Independent lanes, not a global queue

All current and future apps, agents, Make scenarios, GitHub workflows, website, portal, backend, services, and platform components are separate delivery lanes when their scopes do not conflict.

Required lane identity:

- `change_id`
- `component_id`
- `lane_id`
- explicit scope / changed paths
- declared dependencies and contracts
- candidate identity
- rollback / last-known-good identity
- owner agent

Rules:

1. Development may proceed simultaneously.
2. A lane validates its own scope plus declared dependency/contract checks.
3. Unrelated changes on `main` do not force rebuilds, retests, or waiting.
4. Only real merge conflicts, changed-path overlap, declared-contract overlap, or declared dependency conflicts force synchronization.
5. Non-conflicting lanes keep moving and may promote independently.
6. The exact tested candidate must be promoted; SHA/artifact/revision substitution is not green.

## GitHub, Notion, runtime, and Brain roles

### GitHub — desired state and executable memory

GitHub is authoritative for reproducible technical truth:

- application and service code;
- agent contracts and instructions;
- schemas and interfaces;
- CI/CD workflows and policies;
- tests and regression checks;
- Make desired-state specifications where representable;
- component registry and dependencies;
- security/cost/performance guardrails;
- rollback rules;
- executable lessons learned.

A lesson is not fully learned until it has been converted where possible into an executable control: test, validator, contract, policy, lint rule, health check, budget, or recovery rule.

### Notion — operational/projected business information

Notion may remain a business, planning, content, audit, and human-readable projection layer. It must never be the sole authority for deployed identity, source code, delivery policy, production state, or a technical rule required to reproduce the system.

### Runtime systems — actual execution state

Make, Netlify, GitHub Actions, applications, databases, APIs, and other platforms are where workloads actually run. The Brain compares runtime evidence against GitHub desired state and treats material mismatches as drift.

### BRAIN — control plane and shared intelligence

The Brain coordinates ownership, shared context, dependency awareness, runtime evidence, learning, costs, opportunities, incidents, recoveries, and production outcomes. No agent maintains an isolated private truth for material system behavior.

## Canonical gates

A production candidate must pass the applicable gates for its lane:

1. registration/scope gate;
2. schema and contract gate;
3. impacted quality/test gate;
4. security gate;
5. cost/performance gate;
6. preview/runtime gate;
7. current-main file, conflict-contract and declared-dependency gate;
8. rollback-readiness gate;
9. exact-candidate identity gate;
10. production outcome verification gate.

Unknown active scope and unregistered new components fail closed before production.

## Production authority

For GitHub-backed production promotions, BG169 is the canonical promotion authority. Agents and workflows must not silently bypass it.

Before material execution, the current shared context is read through the canonical Brain context path (including BG167 where applicable). Material outcomes are written back through the canonical learning paths (including BG168/BG166 where applicable), followed by a shared-context refresh.

Material outcomes include at minimum:

- `ERROR`
- `RECOVERY`
- `IMPROVEMENT`
- `OPPORTUNITY`
- `EXPERIMENT_RESULT`
- `MISSED_OBLIGATION`
- `AUTO_REPAIR`
- `PRODUCTION_PROMOTION`
- `PRODUCTION_ROLLBACK`
- `CONTRACT_CHANGE`

## Self-healing and green-to-done

For safely recoverable failures, red is diagnosis input, not a terminal state.

Required recovery loop:

`detect -> gather evidence -> root cause -> regression guard -> minimal fix -> retest -> preview -> promote if green -> verify production -> rollback if needed -> learn -> prevent recurrence`

Terminal states are only:

- `PRODUCTION_GREEN`
- `ROLLED_BACK_GREEN`
- `BLOCKED_HARD_BOUNDARY`

Hard boundaries are limited to actions requiring secrets/credentials/permissions changes, weakening security controls, destructive or irreversible data changes, increased paid resources, or legally/financially binding actions.

Retries must be evidence-driven. After at most two identical retries without new information, the lane must change hypothesis, change the fix, or use a proven fallback.

## Event-driven by default

Where platforms support events/webhooks, the Brain should react to change rather than repeatedly poll unchanged systems. Polling remains a compatibility fallback when no reliable event source exists.

Preferred triggers include:

- GitHub push/PR/workflow events;
- Netlify deploy events;
- Make execution/error events;
- runtime health events;
- new component registration;
- material cost/security/performance threshold breaches.

This reduces latency, duplicate work, Make operations, token use, and API cost.

## Dependency-aware testing

The system should maintain a machine-readable dependency graph. Each lane derives the minimum safe validation set from:

- changed paths;
- component ownership;
- declared contracts;
- runtime dependencies;
- known regression fingerprints.

Independent checks run in parallel. Full-system validation is reserved for changes that genuinely cross shared contracts, architecture boundaries, or platform-wide invariants.

## Cost as a first-class delivery metric

Cost is part of quality. Delivery evidence should capture, where measurable:

- Make operations;
- token usage;
- external API calls;
- compute/runtime;
- build duration;
- data transfer;
- estimated recurring cost.

A change that materially increases cost without declared benefit should fail or require an explicit accepted trade-off. The Brain should continuously search for cheaper execution paths that preserve or improve outcome quality, latency, reliability, and security.

## New-component onboarding

A new app, agent, Make scenario, workflow, service, platform integration, or future component is not production-ready until it has:

- a registered `component_id` and owner;
- dependency and contract declarations;
- shared-context read capability;
- applicable test/security/cost/performance gates;
- rollback/last-known-good strategy;
- production verification;
- material outcome writeback;
- dashboard/control-plane visibility.

Registration should be automatic wherever technically possible.

## Anti-conflict rule for future chats and agents

Future discussions may extend this architecture but must not fork it. A proposed improvement must be classified as one of:

- clarification of the canonical flow;
- stricter gate;
- faster equivalent implementation;
- cheaper equivalent implementation;
- safer recovery mechanism;
- new component plugged into the same contracts;
- explicit versioned architecture change.

A second CI/CD engine, second production authority, second shared-memory truth, or chat-specific deployment policy is prohibited.

## Success definition

The architecture is working when multiple teams/agents can build simultaneously, unrelated lanes never block each other, relevant checks run in parallel, safe green candidates reach production independently, production runs the exact tested identity, failures self-heal or safely roll back, and every material outcome improves the shared Brain for the next run.
