# Development ledger — GitHub ghost-aware queue-capacity evidence (2026-10-22)

- Event: DELIVERY_PREDICTIVE_GHOST_AWARE_QUEUE_CAPACITY_CANDIDATE
- Obligation-ID: delivery|predictive-lane-capacity|ghost-aware-fast-ci|20261022-v1
- Fingerprint: delivery|predictive-lane-capacity|ghost-aware-fast-ci|20261022-v1
- Owner: canonical issue #4661; no duplicate controller or scheduler
- Related provider incident: #4655 (still OPEN)
- Main epoch at branch creation: 4ce0846ca51227169389241d3a122b274795a0b2
- Verified historic provider run IDs: 37642383514, 37642383517, 37642336315, 37642334843
- True prior attempt results: cancel 409, force 409, DELETE 403; provider root cause unverified
- Verified existing Janitor run: 39807553086, completed/success, 4 ghosts, 0 repeated mutation attempts
- Proposed root-cause correction: distinguish actionable and provider-ghost queue only with exact current readback, zero jobs, supported canonical incident provider-denied marker and validated SHA/age
- Regression: tests/delivery-powerhouse-supervisor.test.mjs, including 5 raw / 4 verified ghosts / 1 actionable and every fail-closed safety branch
- Runtime data owner: existing Repository Janitor artifact; no new job/scheduler
- Source: tools/delivery/predictive-controller.mjs; .github/scripts/github-actions-ghost-reconcile.mjs
- Prevention rule: incomplete proof = no exclusion; required/CodeQL/current heads always count; raw queue remains visible; provider still red
- Human explanation: docs/changes/ghost-aware-predictive-queue-pressure-20261022-v1.md
- Brain learning: brain/learning/2026-10-22-ghost-aware-predictive-queue-pressure-v1.json
- Skill projection: .agents/skills/powerhouse-continuity/SKILL.md
- Map: platform/system-map/canonical-system-map.mjs
- Status: CANDIDATE; exact SHA CI, protected merge and live Janitor run required; broader #4661 goals separately open.

- Recovery amendment: exact provider queued list total_count can differ from listed rows (12 vs 10) or exact known run APIs (0 vs 4); duplicated run IDs can over-discount capacity.
- Fail-closed fix: propagate independently reported count and exact queued IDs, reject duplicate IDs/proofs, verify trusted actor on provider-block evidence, emit PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT and hold optional dispatch.
- Replay: tests/delivery-powerhouse-supervisor.test.mjs + tests/brain-delivery-stale-queue-janitor-v1.test.mjs. Candidate only until protected exact-head CI, merge and live Janitor readback. No new scheduler, no bypass, provider issue #4655 remains open.
