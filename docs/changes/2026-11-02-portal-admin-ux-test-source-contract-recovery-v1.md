# 2026-11-02 — Original Portal V2 admin UX proof test contract repair

Parent #4547. Source PR #5308 merged and Netlify production source is `e9afb69de49732ebd6398b6f96d03a2876bde015` (deploy `6ae8a0213e2f4b45722cd769` READY). Actual original full postmerge BRAIN run `41463765668` / backend job `125339867747` reported **four** failures: three unrelated historical content-orchestrator string contracts and one old Portal V2 failure-coverage string contract (test #3029).

### Diagnosis
The original protected admin endpoint retained `failureCoverage` and all authentication/tenant gating, but the safe #5308 design appended `portalUxReleaseProof` to the `systemMap` object. The historical regression still required the *exact* prior closed object literal; it failed because the API was safely additive, not because the incident aggregate or access control had disappeared.

### Bounded recovery
Update only the original `tests/brain-portal-failure-coverage-readback-20261029.test.mjs` assertion to require the full current shape and explicitly assert the original admin+tenant boundary, incident aggregate and new UX proof card. No production code, database mutation, service key, policy relaxations, skipped tests, release override or parallel writer. The three other content tests are covered by the separate active original source-safe content recovery PR #5311; this candidate does not claim to repair them.

### Original incident learning
ONE BRAIN record `brain/learning/2026-11-02-portal-admin-ux-test-source-contract-recovery-v1.json` captures cause, evidence, tests and prevention. Fail-closed acceptance requires original Required/CodeQL/BRAIN and independently verified postmerge run. Historical failures are retained. This candidate does not prove the authenticated admin card was manually opened, WCAG AA, SUS, two-tenant access or new sales.

## Original protected postmerge validation and skill prevention — 2026-11-02
- Original #5312 source-contract recovery merged at `b7265b87ad5157d1afd179ee9b271a1ce5a8f3fc`. Independent original BRAIN backend run `41465927780`, job `125347160483`, closed with **5,442 tests: 5,440 pass, 0 fail, 2 skipped**. Both CodeQL languages, original candidate gate, protected merge and handoff also succeeded. The historical #5308 and #5311 failed backend runs remain in provenance; fix is not retroactively applied to them.
- Original ONE BRAIN incident occurrence: `github:arthurprinsen-ai/Bedrijfsgeheugen:actions:run:41464841492:job:125343823177:test:brain-portal-failure-coverage-readback-20261029`; fingerprint `portal|brain-postmerge|legacy-failure-coverage-exact-systemmap-shape|20261102-v1`; maturity `OBSERVED` until applied original owner skill and a later independent natural recurrence prove prevention.
- Update the original `.agents/skills/portal-living-interface/SKILL.md` with explicit scan of *all* older source-contract tests before safe additive observability changes. This change is limited to skill and human-readable append-only documentation. It does not introduce a parallel writer, change auth/runtime, mutate tests, replay database migrations or assert admin browser proof. True UX acceptance remains due.
