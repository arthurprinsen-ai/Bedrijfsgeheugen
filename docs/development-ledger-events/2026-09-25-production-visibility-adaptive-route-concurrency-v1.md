# Ledger — adaptive production visibility concurrency

- Datum: 2026-09-25
- Failure class: BOUNDED_BROWSER_GATE_UNDERSIZED_CONCURRENCY
- Observed evidence: Canonical brand shell live readback run 36134045231 exceeded the 480000ms sweep budget at /security phone.
- Root cause: viewport-level parallelism was active, but fixed routeConcurrency=4 no longer matched the current sitemap workload.
- Change: adaptive route concurrency from sitemap size, capped at eight workers per viewport.
- Regression: tests/brain-standalone-visibility-boundedness-v1.test.mjs
- Skill: .agents/skills/powerhouse-browser-gate-boundedness/SKILL.md
- Terminal condition: protected merge + exact main Netlify deploy + green production readback.
