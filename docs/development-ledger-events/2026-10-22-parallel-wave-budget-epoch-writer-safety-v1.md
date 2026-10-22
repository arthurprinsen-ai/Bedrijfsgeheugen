# Immutable development evidence — parallel wave capacity

- Date: 2026-10-22
- Fingerprint / obligation: `delivery|parallel-wave-budget|epoch-writer-safety|20261022-v1`
- Root cause: unlimited independent ready-wave fan-out and missing epoch / candidate-writer conflict checks
- Baseline: the existing canonical parallel planner and delivery/Engineering OS policies (no replacement scheduler)
- Intervention: bounded deterministic work waves, exact writer identity and base-epoch serialization, direct executor guard
- Regression: `tests/brain-parallel-engineering-fabric.test.mjs`
- Status: CANDIDATE_NOT_PRODUCTION_VERIFIED
- Exact-head Required / CodeQL: pending
- Main/provider readback: pending
- Realized speedup: unmeasured; no claim
- Recovery: revert through protected pull request if a genuine regression is observed
