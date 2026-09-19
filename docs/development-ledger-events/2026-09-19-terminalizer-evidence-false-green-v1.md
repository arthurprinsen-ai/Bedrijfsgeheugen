# 2026-09-19 — Terminal evidence false-green prevention

- Obligation-ID: github-terminalizer-evidence-false-green-v1
- Fingerprint: github|terminalizer|evidence-all-checks-required-v1
- Failure class: TERMINAL_EVIDENCE_FALSE_GREEN
- Trigger: successful terminalizer run 35450985293 emitted LIVE_BEWEZEN while merged_lineage_verified was false.
- Root cause: same-step GITHUB_ENV timing plus incomplete final evidence assertion.
- Prevention: direct same-step env propagation and fail-closed validation of every required terminal check before assigning LIVE_BEWEZEN.
- Regression: tests/brain-obligation-terminalizer-evidence-failclosed.test.mjs
- Learning/skill: brain/learning/2026-09-19-terminalizer-evidence-false-green-v1.json; .agents/skills/powerhouse-delivery-self-optimization/SKILL.md
- Delivery state: RECORDED_PENDING_FINAL_DELIVERY_READBACK
