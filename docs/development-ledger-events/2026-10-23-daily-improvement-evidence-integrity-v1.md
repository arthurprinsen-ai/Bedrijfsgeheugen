# Append-only delivery ledger — daily-improvement evidence integrity

Date: 2026-10-23
Fingerprint: `learning|daily-self-evolution|synthetic-probe-metrics-confused-with-observed|20261023-v1`
Canonical parent: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661)
Workflow: `.github/workflows/powerhouse-daily-self-evolution.yml`
Source: `scripts/brain/continuous-improvement/run-autonomous-improvement.mjs`

- **OBSERVED** — Probe had hardcoded 99.9 reliability, 100ms latency, 10 cost per outcome, and champion with 30 fabricated observations without fetching production metrics.
- **CANDIDATE** — Replace static values with unknown/null, champion with null, and add a non-promotable provenance marker. Existing measurement engine, Brain memory and scheduler are preserved.
- **REGRESSION** — Original `tests/brain-autonomous-improvement-runtime.test.mjs` now rejects invented values and asserts runtime HOLD; CI execution still required.
- **RELEASE** — No bypass of native Required/CodeQL/branch protection, no direct main write, no production DDL, no additional paid Supabase preview branch. Exact-head tests and main/provider readback pending.
- **BUSINESS EFFECT** — Unmeasured; do not claim faster, smarter or more profitable from code diff or simulated fixtures.
- **NEXT SAFE STEP** — Verify exact-head CI and deployment, observe independent daily learning and model-freshness job receipts; only then promote learning maturity and run representative real-data champion/challenger evaluation.

Boundary: this is a quality correction within one existing agent improvement obligation, not a replacement for #3742/#4733 Supabase provider preview repair.
