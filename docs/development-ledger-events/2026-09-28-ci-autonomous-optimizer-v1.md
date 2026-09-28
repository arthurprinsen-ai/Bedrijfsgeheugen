# CI Autonomous Optimizer fan-out/skip tuning — activity ledger

Date: 2026-09-28
Obligation: ci-autonomous-optimizer-fanout-skip-v1

Implemented:
- fan-out p95 input in daily tuning;
- skipped-job ratio input in daily tuning;
- orchestration-waste decision path;
- stricter conditions before automatically increasing parallelism;
- telemetry/tuning separation so observations cannot become persistent tuning state;
- regression coverage.

Expected effect:
- fewer CI waves when fan-out itself is the bottleneck;
- less runner waste from over-parallelization;
- daily self-tuning remains protected-PR based and safety-preserving.
