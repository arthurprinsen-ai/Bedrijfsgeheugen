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
