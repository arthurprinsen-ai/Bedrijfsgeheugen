# Incident registration and self-fix duty enforced in the agent preflight

On 29 October 2026 Arthur decided that every agent and every skill must always register incidents and errors, and must fix them itself when a safe executable step exists. The decision was recorded in the Loop Constitution and the START HIER entry point, but it was text only: the agent preflight did not know about it.

The mandatory chat-learning preflight now loads one new policy, `brain/policies/powerhouse-incident-register-and-self-fix-v1.json`, and exposes an `incident_self_fix` section in its packet. The policy fails closed on drift. Skills are scanned in `.agents/skills/*/SKILL.md`: a skill that carries the marker `INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1` counts as covered; a skill without it that is listed in `loop_debt_baseline` is reported as visible loop debt; any other skill without it fails the preflight. The 40 existing skills are the baseline and shrink by removal when a skill is next changed. `powerhouse-continuity` carries the canonical text and the marker. AGENTS.md gets a short pointer.

Reserved for the owner, unchanged: irreversible or costly decisions, protected merge, production migrations, spend and credits, and anything sent to third parties. At those boundaries the agent prepares, records one deduplicated obligation with evidence and a recovery path, and stops.

Not covered yet: runtime agents (edge functions, Make scenarios) have no uniform file to scan, so their duty remains policy until a runtime check exists. No new store, scheduler, writer or provider call is introduced; registration uses the existing Brain learning and error layer.

Validation: `tests/brain-incident-register-self-fix-preflight-20261029.test.mjs` (7 tests; fails on the base commit). Existing skill, preflight, system-map and learning suites pass. Required, CodeQL, protected merge and an independent main readback remain mandatory before this counts as live. Rollback is a protected revert of this change.
