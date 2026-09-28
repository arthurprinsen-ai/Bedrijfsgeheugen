# CI Calibration → Optimizer handoff — activity ledger

Date: 2026-09-28
Obligation: ci-calibration-optimizer-handoff-v1

Implemented:
- optimizer consumes canonical report.calibration;
- high-priority recommendations veto upward parallelism/speculation;
- calibration IDs recorded in non-persistent signals;
- calibration cannot directly write tuning;
- protected PR and all safety gates remain unchanged;
- regressions prove high-priority veto and medium-priority non-veto behavior.
