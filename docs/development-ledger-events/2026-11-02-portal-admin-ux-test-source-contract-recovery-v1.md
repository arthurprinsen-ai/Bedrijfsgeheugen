# 2026-11-02 — Original Portal V2 admin UX proof test contract repair

Parent #4547. Source PR #5308 merged and Netlify production source is `e9afb69de49732ebd6398b6f96d03a2876bde015` (deploy `6ae8a0213e2f4b45722cd769` READY). Actual original full postmerge BRAIN run `41463765668` / backend job `125339867747` reported **four** failures: three unrelated historical content-orchestrator string contracts and one old Portal V2 failure-coverage string contract (test #3029).

### Diagnosis
The original protected admin endpoint retained `failureCoverage` and all authentication/tenant gating, but the safe #5308 design appended `portalUxReleaseProof` to the `systemMap` object. The historical regression still required the *exact* prior closed object literal; it failed because the API was safely additive, not because the incident aggregate or access control had disappeared.

### Bounded recovery
Update only the original `tests/brain-portal-failure-coverage-readback-20261029.test.mjs` assertion to require the full current shape and explicitly assert the original admin+tenant boundary, incident aggregate and new UX proof card. No production code, database mutation, service key, policy relaxations, skipped tests, release override or parallel writer. The three other content tests are covered by the separate active original source-safe content recovery PR #5311; this candidate does not claim to repair them.

### Original incident learning
ONE BRAIN record `brain/learning/2026-11-02-portal-admin-ux-test-source-contract-recovery-v1.json` captures cause, evidence, tests and prevention. Fail-closed acceptance requires original Required/CodeQL/BRAIN and independently verified postmerge run. Historical failures are retained. This candidate does not prove the authenticated admin card was manually opened, WCAG AA, SUS, two-tenant access or new sales.
