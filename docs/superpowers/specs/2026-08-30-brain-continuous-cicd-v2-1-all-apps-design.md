# BRAIN Continuous CI/CD v2.1 — All Apps Architecture Design

## Status
Normative extension of the live `BRAIN-DELIVERY-v2` architecture. The existing richer v2 implementation on `main` remains canonical; v2.1 adds explicit no-batch/no-wait invariants, all-app scope and measurable throughput targets.

## Goal
Every current and future application, integration, agent, scenario and platform connected to Bedrijfsgeheugen operates as part of one Brain delivery architecture. An independently safe change is validated and activated in production immediately after its own gates are green. Unrelated changes are never accumulated into a later batch or release train.

Universal loop:

**change → isolate where needed → validate → conflict/dependency check → activate immediately → verify live outcome → measure → learn → shared memory**

Repository-backed changes merge against current moving `main` and the exact resulting production identity is verified. SaaS/config/data changes use platform-native atomic/versioned execution and exact read-back evidence rather than artificial Git semantics.

## Universal scope
The contract applies to every registered Brain platform, including at minimum GitHub, Netlify, Make, Notion, Supabase and DataForSEO. The live platform-adapter registry is intentionally broader and includes current services such as Canva, HeyGen, Windsor, Google services, LinkedIn, Meta/Instagram, OpenArt, Tavily, Calendly and AI model services. New platforms inherit the same contract automatically.

## No delivery islands
No app may maintain a separate release truth, private release train or batch queue for unrelated safe work. Every active platform requires a registered adapter/contract with owner, validation, production identity/revision, evidence, rollback/fallback, cost/security governance and BG167/BG168/BG169 integration.

Missing platform registration is an architecture gap, not an exemption.

## Moving main
`main` is expected to move continuously. `behind_by > 0` is not a conflict. Rebuild/replay/rebase is prohibited solely to make a branch contain unrelated newer commits.

Reconciliation is bounded to proven overlap: merge conflict, changed-path overlap, declared contract overlap, declared dependency conflict, protected invariant overlap or equivalent work already landed and requiring dedupe.

If there is no relevant overlap, the tested candidate remains valid and safe work continues.

## Smallest safe change is the release unit
There are no unrelated release batches. Ten independent green changes may produce ten independently traceable production promotions as soon as each becomes safe.

A change may wait only for a true dependency, shared contract/schema conflict, narrow non-commutative resource lease, its own failed gate or immutable hard boundary. `main moved`, `another agent is working`, `another app has a pending change`, `release window` and `we usually bundle these` are invalid waiting reasons.

## Platform-native execution
Repository/code changes use short-lived isolation, affected CI lanes, conflict/dependency checks, immediate merge and exact production identity verification.

Transactional SaaS/data changes such as Notion, Supabase and Make use optimistic concurrency/version checks where supported, smallest safe atomic mutation, migration/transaction/staging where required, immediate activation after their own gates are green and exact post-change read-back.

Evidence/API platforms such as DataForSEO validate source, provenance, freshness, query/config contract and cost budget. A failed source acquisition blocks only that evidence path.

## Cross-platform dependencies
Dependencies are defined by contracts and resources, not by app names. A portal and Supabase change may share a state schema; Make and Notion may share an input/output schema; DataForSEO and SEO intelligence may share an evidence contract. Compatible additive changes proceed independently. Breaking changes reconcile only the true dependents.

No global development lock is allowed.

## Production authority
BG169 remains deterministic production/live activation authority. Git candidates use exact merge/deploy identities. Non-Git platforms use equivalent exact state identities such as object version, schema/migration id, scenario revision, configuration revision, read-back marker or query contract version.

For non-Git changes BG169 can authorize `PLATFORM_PROMOTION_READY`; the platform-native actuator executes; only verified live read-back may become `PRODUCTION_GREEN`.

`GREEN MEANS OUTCOME VERIFIED`: HTTP success, save success or dispatch acknowledgement alone is never sufficient when the intended live outcome is absent.

## Failure isolation
A red candidate blocks only itself and true dependents. Last-known-good remains available where possible. Unrelated green changes continue. Retries are bounded and hypothesis-driven. Rollback/revert/restore/fallback targets the narrowest offending change. Error/recovery/outcome learning goes through BG168/BG166 and current context is refreshed through BG167.

## Shared memory and new chats
This architecture is not conversation memory. It is enforced by repository contracts/tests, platform adapters, BG166 history, BG167 shared current context, BG168 outcome routing and BG169 authority. Every new chat/agent/scenario must load shared context before production-related mutation and write material outcomes afterwards.

## Speed and cost metrics
Track per platform and globally: time-to-live, unrelated wait, rebuilds caused by unrelated main drift, avoidable serial writes, duplicate work, CI duration, rollback duration, platform operation cost, failed activation rate and safely skipped unaffected gates.

Targets: unrelated wait caused by unrelated work = 0; branch rebuilds caused solely by unrelated `main` drift = 0.

## Hard boundaries
Direct release never overrides secrets/credentials/permissions, security weakening, destructive/irreversible data, paid-resource increases or legally/financially binding action boundaries. A hard boundary blocks only the affected action, never unrelated delivery.

## Required invariants
1. `ALL APPS ARE PART OF ONE BRAIN DELIVERY ARCHITECTURE`.
2. `NO PLATFORM-SPECIFIC RELEASE ISLANDS`.
3. `GREEN SAFE CHANGES ACTIVATE IMMEDIATELY`.
4. `UNRELATED CHANGES ARE NEVER BATCHED`.
5. `UNRELATED WORK NEVER WAITS`.
6. `MAIN MAY MOVE; SAFE WORK MUST CONTINUE`.
7. `NO REBUILD FOR NON-OVERLAPPING MAIN DRIFT`.
8. `PLATFORM-NATIVE ATOMICITY, BRAIN-NATIVE GOVERNANCE`.
9. `CROSS-PLATFORM CONTRACTS DEFINE TRUE DEPENDENCIES`.
10. `EVERY LIVE MUTATION HAS EXACT READ-BACK/OUTCOME EVIDENCE`.
11. `A RED CHANGE BLOCKS ONLY ITSELF AND TRUE DEPENDENTS`.
12. `EVERY NEW CHAT, AGENT, SCENARIO AND APP INHERITS THIS CONTRACT`.

## Acceptance
Implemented when the live adapter registry covers all connected platforms, independently green changes activate without unrelated batching/waiting, moving-main unrelated drift never causes rebuild, true overlap gets bounded reconcile, exact live identity/outcome is verified, failures remain isolated, BG167/BG168/BG169 remain authoritative, and regression tests fail if these rules regress.
