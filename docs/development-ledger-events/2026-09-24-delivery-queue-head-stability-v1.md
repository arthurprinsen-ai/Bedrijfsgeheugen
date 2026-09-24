# 2026-09-24 — Delivery queue head stability

- Fingerprint: `delivery-queue-head-stability-20260924-v1`
- Incident lineage: `pricing-terminal-live-proof-20260924-v1`
- Failure class: queue state misclassified as candidate defect.
- Impact: unnecessary head SHA churn, restarted exact-head gates, delayed protected merge.
- Permanent control: queue-only states may re-dispatch workflows but may not mutate candidate code.
- Branch mutation authority: only concrete failed-step repair or `MERGE_CONFLICT_RECOVERY` with active terminal writer lease.
- Regression: `tests/brain-ci-admission-single-flight.test.mjs`.
- Production evidence already reached for predecessor: commit `929146c1aaada8f07235b5712f771e51c3b58f9d`, deploy `6ab5519db93e640008d32002`.
- Terminal status: current recovery head still requires protected checks/merge and final pricing/i18n browser proof.
