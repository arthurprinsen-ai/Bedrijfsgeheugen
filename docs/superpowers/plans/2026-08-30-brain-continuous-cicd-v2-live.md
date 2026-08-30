# BRAIN Continuous CI/CD v2 — production rollout plan

## Goal
Make independent delivery with shared intelligence the default for every current and future app, agent, Make scenario, workflow, portal, website, backend and service.

## Non-negotiable invariants
1. Work may develop concurrently; production promotion is per delivery lane/component.
2. A lane promotes only the exact candidate SHA/artifact/scenario revision that passed its own gates.
3. Moving `main` alone never invalidates an already-tested independent candidate; conflicts are decided from declared scopes/dependencies, not repository-wide serialization.
4. BG169 remains the sole production promotion authority for GitHub-backed production changes.
5. BG167 context is consulted before execution and BG168/BG166 receive outcomes/errors/learnings after execution.
6. Cost, security, quality, contract/schema, rollback and production verification are mandatory gates.
7. Every new component auto-registers through the shared delivery contract before it may promote.
8. Notion is a human-facing projection/audit surface, never the production source of truth.
9. Existing scenarios are migrated by central contract/gateway compatibility first; avoid adding expensive modules to every scenario unless needed.
10. Production state is exact and auditable: candidate identity, tested identity, deployed identity, verifier evidence, rollback identity and learning trace must be linked.

## Implementation tasks
1. Add `BRAIN-DELIVERY-v2` contract and deterministic lane policy module.
2. Add regression tests covering independent lanes, exact identity, dependency conflicts, gates, registration and learning requirements.
3. Extend Brain verification workflow to validate the v2 contract/policy.
4. Add a reusable delivery-manifest format so GitHub/Netlify/Make/Notion/agents share one lifecycle vocabulary.
5. Add/upgrade the Make orchestration gateway to call BG167 → validation/promotion authority BG169 → BG168/BG166 without duplicating logic across scenarios.
6. Backfill current Make services/scenarios into the registry/projection and enforce v2 on new ones.
7. Make ongoing development lanes opt into the same contract via repository agent instructions and CI checks.
8. Verify CI, exact production promotion, runtime health and learning writeback before marking rollout green.

## Rollout strategy
- Compatibility-first: existing production keeps running while v2 central gates are introduced.
- No bulk destructive scenario rewrites.
- New work must use v2 immediately once the contract is merged.
- Existing scenarios are progressively covered by the central gateway/registry and are blocked only when they attempt a production promotion that violates v2.
- Rollback uses last-known-good verified identity and preserves Git history.

## Definition of done
- v2 tests green on the exact PR head.
- PR merged only by the promotion authority / guarded exact-head merge.
- deployed production identity verified against the promoted identity.
- Brain outcome/learning persisted.
- current Make inventory represented by the central registry/projection or explicitly classified as non-promoting/read-only.
- future components cannot silently bypass registration + gates.
