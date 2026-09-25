# 2026-09-25 — Production browser step timeout

- Fingerprint: `production-browser-step-timeout-v1`
- Trigger: production runs 36094845048 and 36094845055 stayed in one browser verification step beyond their intended internal verifier budget.
- Root cause: internal JS budgets cannot kill a wedged Playwright/browser process; only the 25-minute job timeout guaranteed process termination.
- Fix: OS-level 10-minute `timeout` around both production browser verifier commands, with 30-second TERM→KILL grace.
- Regression: `tests/brain-production-browser-step-timeout-v1.test.mjs`
- Safety: fail-closed; no visibility, pricing, interaction or locale assertion is removed.
- Status: `IMPLEMENTED_CANDIDATE` pending protected merge and production/control-plane readback.
