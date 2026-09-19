# 2026-09-19 — CI path-scope fanout v1

- Obligation-ID: powerhouse-ci-path-scope-fanout-v1
- Fingerprint: github|ci-path-scope|specialist-fanout-v1
- Failure class: GITHUB_DELIVERY
- Root cause: specialist workflows subscribed to generic Supabase migration changes and Revenue Learning duplicated path entries.
- Prevention: narrow specialist path filters; keep generic migration integrity in canonical Supabase/Required gates.
- Regression: tests/delivery-ci-path-scope-fanout.test.mjs
- Skill projection: .agents/skills/powerhouse-delivery-self-optimization/SKILL.md
- Delivery status: RECORDED_PENDING_FINAL_DELIVERY_READBACK
