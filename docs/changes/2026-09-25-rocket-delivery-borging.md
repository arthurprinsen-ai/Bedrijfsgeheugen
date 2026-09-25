# Rocket Delivery v1 — borging closure

## Context

PR #3096 consolidated GitHub Actions fan-out and protected delivery around one canonical PR authority. During verification, Powerhouse Skill Projection exposed a false-negative regression test: the workflow already contained the intended CodeQL concurrency expression, but the test treated the fixed GitHub expression as a regular expression.

## Durable rule

Fixed GitHub Actions expressions using `${{ ... }}` are asserted with literal containment/equality unless pattern matching is intentionally required. A visible literal match in failure output is a signal to inspect the test oracle before modifying working workflow behavior.

Fan-out optimization is also verified after protected merge by enumerating runs attached to the exact resulting `main` SHA. YAML intent alone is not terminal evidence.

## Reference evidence

- failing candidate: `d51682668d1551a4ffb55449154dd15ce022c070`
- corrected candidate: `aa969daa38649049abafd61b2e4344859005655a`
- protected merge: `e8054fc35dc2d824afa87a417790a2c3e073062f`
- observed post-merge run count: 7
- production/browser readback on the merged lineage: green

## Canonical surfaces

- Brain learning: `brain/learning/github-expression-literal-assertion-20260925-v1.json`
- Skill: `.agents/skills/powerhouse-delivery-self-optimization/SKILL.md`
- Regression: `tests/brain-github-expression-literal-assertion-v1.test.mjs`
- Ledger: `docs/development-ledger-events/2026-09-25-rocket-delivery-borging.md`
