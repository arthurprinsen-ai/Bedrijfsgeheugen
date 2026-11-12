# Append-only development evidence — 2026-11-12 portal tenant refresh

- Fingerprint: `portal|domain-state|same-member-tenant-switch-refreshes-old-hydration|20261112-v1`.
- Related root-write risk: `portal|domain-state|unmapped-root-edit-orphan-causal-impact|20261112-v1`.
- Original owner: #4215 / existing Portal V2 state and two already registered agents.
- Source review: `refresh` captured `id/email` only, despite `currentPrincipal()` including `app_metadata.tenantId`. The same user can switch tenant without changing ID. Public root/derived paths were not mapped to a canonical child BusinessInput record.
- Fix: exact hydrated-principal fence and fail-closed direct root/internal paths before mutation, not a new executor.
- Regression: `portal-v2/tests/portal-handoff-recovery.test.mjs` (tenant switch, in-flight switch, root/internal rejection) and `tests/brain-portal-tenant-refresh-fence-20261112.test.mjs` (historical/shadow/canary contract).
- Agent+skill: existing `platform/agents/agent-team.mjs` reliability/data-quality roles and `.agents/skills/portal-living-interface/SKILL.md`; machine learning `brain/learning/2026-11-12-portal-tenant-refresh-fence-v1.json`.
- CI at creation: NOT_YET_MEASURED; protected Required/CodeQL and Netlify source-deploy/readback require independent final evidence. No success state asserted.
- Authenticated two-tenant production field/consumer outcome: NOT_YET_PROVEN. Any break, source drift or stage without processed ACK remains an original OPEN obligation with owner, source revision, cause, corrective action and prevention.

## CI recovery — original protected admission 43322632648
- Actual GitHub Required admission #43322632648 failed before portal tests: `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`. Corrected existing PR metadata with immutable candidate base `839086756f2559b9abeb8decc8d945e2f0a3d919`; no security, Required, CodeQL or branch-protection bypass.
- Prevention: every future original owner PR must include `Base-SHA` exactly equal to the verified immutable parent commit before protected checks run. Test/release remains NOT_YET_PROVEN until the fresh exact-head protected workflow succeeds; machine failure cannot be closed by textual acknowledgment alone.

## CI recovery — ONE BRAIN learning canonicalization run 43322840031
- The original Required admission accepted machine PR metadata and emitted `ADMITTED`; the mandatory learning gate then rejected the new machine record with `LEARNING_FAILURE_CLASS_REQUIRED`. No Portal/CodeQL bypass or relaxed validator.
- Original bounded correction: `compiler.failure_class=AUTH`, `security_sensitive=true`, deterministic executable `evaluation.historical_replay`, `evaluation.shadow` and `evaluation.canary`, with a concrete `evidence` object and unchanged source-authority boundary.
- Prevention rule: every newly authored `brain/learning/*.json` must be checked against `scripts/brain/learning-canonicalization-gate.mjs` before opening PR. An invented status or text-only test cannot replace executable evaluation. Exact-head CI remains OPEN pending independent proof.

## CI recovery — original executable replay run 43323168817
- Authentic original learning historical replay executed Node and failed with `SyntaxError: Illegal return statement`. The new arrow-body expression was correctly ended by `;` but retained a second `};` from the removed block. This terminated `refresh` early; no runtime release was made.
- Corrected only the residual brace in `portal-v2/domain-state.js`. Prevention: the original admission learning contract executes `node --test` on changed Brain tests before any protected merge; mandatory Portal and CodeQL checks must remain unchanged. Do not infer live from a passing syntax check.

## CI recovery — native semantic learning run 43323411876
- Original learning compiler and executable replay advanced, but the subsequent independent `scripts/brain/material-writeback-closure-guard.mjs` rejected the candidate with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: semantic_learning`.
- Root cause: the machine record used descriptive `observed_root_causes` and `correction` arrays but lacked required canonical semantic keys `root_cause` and `prevention` (original `evidence` already existed). Added explicit nonempty machine-readable fields, with the same truthful fact/contract and no change to the guard. Required/CodeQL remain pending on a fresh exact head.

## Protected preflight — original System Map generator #43323627350
- Protected hygiene and PostgreSQL lease passed; original preflight rejected the candidate with `SYSTEM_MAP_INTEGRITY_FAIL` because `node scripts/brain/portal-explanation-inventory.mjs --write` generated contentHash `61339cebdcb4a96809ab998405e95f876bd3975d8f7323ff159207fdaaa08dae` instead of historical `6dcc325b0d56f06d6c2f23bd061aa70db4a1231d8c27318a15b5c0e35c3b6c65`. The signed CI output identified exactly `platform/system-map/canonical-system-map.mjs` and `portal-v2/index.html` as the two generated deltas.
- Both original generator outputs were synchronized byte-for-byte on the existing PR branch. No alternative source authority, stale cache, relaxed System Map gate or new runner. Scope-Budget and Change-Scope in the PR metadata include the two generated artifacts. Exact-head Required and CodeQL must independently verify them before source/live closure.
