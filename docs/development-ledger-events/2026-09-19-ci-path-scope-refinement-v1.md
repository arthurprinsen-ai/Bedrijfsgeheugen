# 2026-09-19 — CI path-scope refinement v1

- Obligation-ID: github-ci-path-scope-refinement-v1
- Fingerprint: github|ci-path-scope|specialist-fanout-v1
- Failure class: GITHUB_DELIVERY
- Trigger: current-main readback after the first path-fanout optimization showed remaining direct-dependency, concurrency, filter-parity and timeout gaps.
- Root cause: the initial optimization narrowed broad migration triggers but did not fully encode every direct runtime dependency or normalize the auxiliary execution contract.
- Prevention: explicit direct-runtime path admission, PR/ref single-flight, pull/push semantic parity and bounded auxiliary runtime.
- Implementation: .github/workflows/linkedin-revenue-cockpit-tests.yml; .github/workflows/revenue-learning.yml
- Regression: tests/brain-ci-path-scope-fanout.test.mjs
- Learning/skill: brain/learning/2026-09-19-ci-path-scope-fanout-v1.json; .agents/skills/powerhouse-delivery-self-optimization/SKILL.md
- Delivery state: RECORDED_PENDING_FINAL_DELIVERY_READBACK
