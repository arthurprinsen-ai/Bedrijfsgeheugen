# BRAIN Continuous CI/CD v2.1 — All Apps Architecture Design

## Status
Approved scope extension to `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md`.

This document is normative and supersedes any narrower interpretation in which continuous delivery applies only to GitHub, Netlify, repository code, website, portal or backend changes.

## Goal
Every current and future application, integration, agent, scenario and platform connected to Bedrijfsgeheugen operates as part of one Brain delivery architecture. An independently safe change is validated and activated in production immediately after its own gates are green. Unrelated changes are never accumulated into a later batch or release train.

The universal operating loop is:

**change → isolate where needed → validate → conflict/dependency check → activate immediately → verify live outcome → measure → learn → shared memory**

For repository-backed changes, `activate immediately` means merge to current `main` and deploy the exact merge SHA. For SaaS/config/data changes that have no Git deployment model, `activate immediately` means use the safest platform-native atomic update/staging mechanism available, then verify the resulting live platform state.

## Universal scope
This contract applies to every current and future Brain-connected platform. The known current estate includes at minimum:

- GitHub;
- Netlify;
- Make;
- Notion;
- Supabase;
- DataForSEO;
- website and portal runtimes;
- backend and Netlify Functions;
- all Powerhouse/Bedrijfsgeheugen agents;
- all Make scenarios;
- all data, SEO, CRM, content, intelligence, monitoring and automation integrations registered by or connected to the Brain.

The list is intentionally non-exhaustive. A platform is in scope because it participates in Bedrijfsgeheugen, not because its name was manually added to this document.

## No hidden delivery islands
No current or future app may maintain an independent release truth, private batch queue or separate definition of green.

Every active platform must be represented by a Brain platform component or delivery adapter that declares:

- platform identity;
- owner;
- current production/live state;
- change identity;
- dependency and contract keys;
- validation mechanism;
- activation mechanism;
- idempotency/dedupe mechanism;
- live outcome evidence;
- rollback, restore or safe fallback mechanism;
- cost class;
- security class;
- hard-boundary classification;
- material-outcome writeback path.

A current platform that is connected operationally but is missing from the Brain platform registry is an architecture gap, not an exemption. Discovery must register it before autonomous development or configuration mutation is considered fully production-ready.

## One principle, platform-native mechanics
Continuous CI/CD does not mean forcing Git semantics onto every SaaS application. The Brain uses one governance model with platform-native execution.

### Repository/code platforms
Examples: GitHub-backed website, portal, backend, functions, workflows and configuration.

Flow:

1. create short-lived isolation from current `main`;
2. make the smallest independently safe atomic change;
3. run affected CI/tests/preview in parallel;
4. compare candidate with current moving `main`;
5. do not rebuild for unrelated drift;
6. reconcile only proven path/contract overlap;
7. merge immediately when green;
8. deploy exact merge SHA immediately;
9. verify exact production state;
10. write outcome and learning.

### Transactional data/config platforms
Examples: Supabase database/config/read-model changes, Notion schemas/databases/pages used as operational system state, Make scenario configuration.

Flow:

1. create a change envelope and read BG167 current context;
2. identify affected objects/contracts and current versions;
3. use optimistic concurrency/version checks where supported;
4. validate the smallest change before mutation;
5. apply the change atomically where the platform supports it;
6. use migration/transaction/staging mechanisms when irreversible partial state would otherwise be possible;
7. activate immediately after its own gates are green;
8. read back the exact changed object/version/state;
9. verify outcome obligations;
10. write BG168 outcome/learning and refresh BG167.

Unrelated data/config changes do not wait for each other.

### External evidence/API platforms
Examples: DataForSEO and other research, SEO, analytics or market-data providers.

These platforms may not have a deployable application change for ordinary API reads. Their Brain adapter still follows continuous operational delivery:

- connector/query/config changes are validated and activated immediately when green;
- new evidence becomes available to downstream Brain consumers immediately after source/provenance/quality validation;
- there is no artificial daily/weekly release batch for independently valid evidence;
- rate limits, cost budgets, freshness and source confidence remain hard execution gates;
- failed evidence acquisition does not block unrelated sources or deployments.

### Automation/orchestration platforms
Examples: Make scenarios and agents.

A scenario/agent configuration change is its own release unit. It must not wait for unrelated scenario changes.

Required sequence:

1. shared-context read;
2. dedupe/fingerprint check;
3. bounded configuration change;
4. platform validation;
5. test/on-demand or safe canary where supported;
6. immediate activation when green;
7. live execution/outcome verification;
8. BG168 learning writeback;
9. BG167 current-state refresh.

A scenario must not be recreated merely because another scenario or repository `main` changed.

## Direct release, never unrelated accumulation
The architecture prohibits release batching for unrelated safe work.

If ten agents produce ten independent green changes, the desired behavior is ten independently traceable production promotions as soon as each becomes safe, even if they complete in a different order.

A change may wait only for:

- a real dependency on another not-yet-live change;
- a shared contract/schema conflict;
- an active narrow lease on the same non-commutative resource;
- its own failing validation/security/cost/outcome gate;
- an immutable hard boundary.

`main moved`, `another agent is working`, `another app has a pending change`, `release window`, or `we usually bundle these` are not valid waiting reasons.

## Cross-platform dependency graph
Parallel delivery is governed by dependency and contract keys, not app names.

Examples:

- a portal change and a Supabase schema change may conflict even if they live in different systems;
- a Make scenario and a Notion database schema may share an input/output contract;
- a DataForSEO query schema and SEO optimizer may share evidence-shape contracts;
- a Netlify function and portal client may share an API version;
- an agent and BG167/BG168 may share the team-context schema.

Every change envelope declares affected contract keys. Compatible additive changes proceed independently. Breaking changes require compatibility/versioning or bounded coordinated promotion of only the dependent changes.

No global lock is allowed for ordinary development.

## Continuous production authority
BG169 remains the production authority for governed production/live activation decisions.

For platforms with an explicit deploy step, BG169 authorizes the exact candidate/deploy identity.

For platforms without a traditional deploy artifact, the platform adapter supplies an equivalent exact state identity, such as:

- object version;
- schema/migration id;
- scenario last-edit/version;
- configuration revision;
- record/read-back marker;
- query/connector contract version.

`GREEN MEANS OUTCOME VERIFIED` remains universal. A successful API response or saved configuration alone is not production evidence when the intended live outcome is missing.

## Failure isolation
A red change never becomes a reason to freeze unrelated green work.

The Brain must:

- isolate the failing change and its true dependents;
- keep last-known-good live state where possible;
- continue promoting unrelated green changes;
- retry only with new evidence/hypothesis;
- use the narrowest possible rollback/revert/restore/fallback;
- record failure and recovery in BG168;
- propagate the learned prevention rule through BG167.

## Platform registry requirement
The Brain component registry must evolve from a partial platform inventory to a complete active-platform inventory.

At implementation time the system must discover and register every current connected operational platform. At minimum the implementation must explicitly verify representation/adapters for GitHub, Netlify, Make, Notion, Supabase and DataForSEO.

New apps inherit this requirement automatically at connection/onboarding time. Connection without Brain registration is not considered complete onboarding.

## Chat and agent continuity
This architecture must not depend on one conversation or one agent remembering it.

It is stored and enforced through:

- repository architecture specs and operating contracts;
- machine-readable delivery/platform policy;
- CI/regression contracts;
- BG166 append-only learning/history;
- BG167 current shared context;
- BG168 material outcome/contract-change routing;
- BG169 production authority;
- platform registry/adapters;
- agent and Make scenario onboarding requirements.

Every new chat/agent working on Bedrijfsgeheugen must consume the current shared context and repository contract before changing production-related state.

## Cost and speed invariants
The delivery mechanism must itself become cheaper and faster over time.

Metrics are tracked per platform and globally:

- time from change start to live verified outcome;
- queue/wait time caused by unrelated work, target 0;
- branch rebuilds due to unrelated `main` drift, target 0;
- avoidable serial writes;
- duplicate work;
- platform API/operation cost per verified outcome;
- CI/test duration;
- rollback/recovery duration;
- failed activation rate;
- percentage of unaffected gates skipped safely.

Agents use these metrics to continuously optimize delivery without weakening security, correctness or evidence requirements.

## Immutable hard boundaries
Direct release does not override the existing hard boundaries. Autonomous systems must not:

- change secrets/credentials/permissions without authorization;
- weaken security controls;
- perform destructive or irreversible mutations without the required boundary;
- increase paid resources without authorization;
- execute legally or financially binding actions autonomously.

A hard boundary blocks only the affected action. It never becomes a reason to hold unrelated releases.

## Additional required invariants
The v2 invariants remain in force and are extended with:

1. `ALL APPS ARE PART OF ONE BRAIN DELIVERY ARCHITECTURE`.
2. `NO PLATFORM-SPECIFIC RELEASE ISLANDS`.
3. `GREEN SAFE CHANGES ACTIVATE IMMEDIATELY`.
4. `UNRELATED CHANGES ARE NEVER BATCHED`.
5. `PLATFORM-NATIVE ATOMICITY, BRAIN-NATIVE GOVERNANCE`.
6. `EVERY CONNECTED PLATFORM MUST BE REGISTERED`.
7. `CROSS-PLATFORM CONTRACTS, NOT APP NAMES, DEFINE DEPENDENCIES`.
8. `A RED CHANGE BLOCKS ONLY ITSELF AND TRUE DEPENDENTS`.
9. `EVERY LIVE MUTATION HAS EXACT READ-BACK/OUTCOME EVIDENCE`.
10. `EVERY NEW CHAT, AGENT, SCENARIO AND APP INHERITS THE SAME CONTRACT`.

## Acceptance criteria
This extension is implemented only when:

- the platform registry covers all current active Bedrijfsgeheugen-connected apps, with GitHub, Netlify, Make, Notion, Supabase and DataForSEO explicitly verified;
- every development/configuration-capable platform has a delivery adapter or equivalent machine contract;
- independent safe changes on different apps can activate simultaneously without waiting for one another;
- Git changes continue to tolerate unrelated moving-main drift;
- non-Git SaaS changes use version/transaction/read-back controls appropriate to that platform;
- cross-platform contract overlap triggers bounded reconciliation instead of global blocking;
- independently green changes are activated individually and immediately;
- a failure in one platform does not stop unrelated green releases elsewhere;
- BG167 exposes current cross-platform change/dependency state;
- BG168 receives all material change/promotion/failure/recovery learning;
- BG169 remains the governing production authority;
- new platform onboarding automatically requires Brain registration and this delivery contract;
- regression tests/policies fail if unrelated batching, hidden platform islands or rebuild-on-unrelated-drift behavior is reintroduced.

## Migration rule
This architecture is introduced additively. Existing working platform flows remain last-known-good until their Brain delivery adapters prove green. Migration itself must not create a big-bang release or force all platforms to wait for one another.

Each platform is brought under the contract independently and immediately becomes governed by it once its adapter is verified.