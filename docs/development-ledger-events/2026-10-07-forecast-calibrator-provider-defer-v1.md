# 2026-10-07 — Forecast calibrator provider defer

- Obligation: `forecast-calibrator-provider-defer-20261007-v1`
- Baseline: `0219cf283e9fabe6e17583210133d0e6a5b846cb`
- Provider version 51 was ACTIVE and byte-identical to main.
- Live request 143 exercised four real due calibrations.
- Anthropic returned HTTP 400 because provider credit was unavailable.
- The previous DirectQuery secondary exception did not recur.
- Recovery: defer affected learning obligations for one hour, open a run-local circuit after the first provider failure, and never fabricate a calibration outcome.
- HTTP 200 degraded is allowed only after durable defer evidence; persistence failure remains fail-closed.
- Regression: `tests/brain-forecast-calibrator-provider-defer-v1.test.mjs`.
