# 2026-10-22 — Brain source oracle: correct single-flight job and identity

- Obligation: `ci-brain-single-flight-oracle-20261022`; parent #3742; related #4215.
- Immutable evidence: [Unified BRAIN 39671036043](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043), 3,511 total / 3,190 pass / 321 fail.
- Exact failing assertion: `tests/brain-actions-pr-single-flight-v1.test.mjs`, subtest 39.
- Current GitHub readback: `canonical-brand-shell-test.yml` job is `brand-shell-contracts`; `canonical-brand-shell-full-build.yml` is `workflow_dispatch` and groups on `github.ref_name`.
- Repair: one test-source oracle corrected to require actual job names and correct event scope, while retaining positive timeouts and single-flight cancellation.
- Source assertions inspected on four workflows before candidate generation.
- No runtime/production deployment or full-suite success asserted. Exact HEAD CI + CodeQL + full zero-failure BRAIN required.
