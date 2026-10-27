# 2026-09-29 — Powerhouse loop assurance v3

Fingerprint: `powerhouse|loop-assurance|receipt-bridge|v3`

## Finding
The existing five-minute assurance controller and 12-loop registry were present, but all loops initially showed 0/8 stage receipts. A critical loop could therefore remain AMBER without any fresh closed-loop proof.

## Change
- Added a conservative receipt bridge from existing `cron.job_run_details` and `powerhouse_runtime_events`.
- No parallel outcome/learning store was introduced.
- Critical loops with zero fresh stage evidence now become RED.
- Added `powerhouse_loop_integrity_health_v1` for fleet-level GREEN/AMBER/RED state.
- Preserved immutable `brain_obligations` identity; only mutable status/evidence/version are updated.

## Production readback
After repair, the live controller executed successfully. At verification time the fleet truth was 12 loops: 0 GREEN, 11 AMBER, 1 RED. This is intentionally truthful: incomplete outcome/learning/guard evidence is not promoted to green.

## Prevention
Future loops must emit explicit outcome, learning and guard receipts from their canonical execution lineage; scheduler activity or provider ACK alone never closes the loop.
