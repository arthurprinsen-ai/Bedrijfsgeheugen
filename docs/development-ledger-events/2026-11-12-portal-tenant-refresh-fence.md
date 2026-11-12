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
