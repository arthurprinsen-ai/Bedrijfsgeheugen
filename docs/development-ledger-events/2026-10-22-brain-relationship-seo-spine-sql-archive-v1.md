# Append-only BRAIN SQL source repair — 2026-10-22

- Obligation: ci-brain-retired-sql-source-relationship-seo-spine-20261022
- Evidence: GitHub run 39671036043 / backend 119469063095; baseline 321 failed
- Root cause: deleted executable migration paths referenced by seven original test reads
- Fix: exact archived SQL source identities validated and seven test input paths corrected; original assertions untouched
- Regression: tests/brain-inherited-relationship-seo-spine-archive-v1.test.mjs; evaluation historical/shadow/canary
- Learning: brain/learning/2026-10-22-brain-relationship-seo-spine-sql-archive-v1.json
- Skill: .agents/skills/powerhouse-relationship-external-intelligence/SKILL.md
- Security: no migration reintroduction, no bypass of protected checks, no production mutation
- Acceptance: CANDIDATE_UNVERIFIED pending Required, CodeQL, full BRAIN 0 failure and authentic migration/tenant evidence
