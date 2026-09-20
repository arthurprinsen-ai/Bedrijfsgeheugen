# Terminal autonomous reconciliation — 20 September 2026

Fingerprint: `terminal-autonomous-reconciler-v1`.

## Problem and root cause

Powerhouse already had strong local recovery mechanisms, but no single aggregate terminal invariant forced every stale or contradictory control-plane state back into recovery. This allowed `PLANNED` operations, `ESCALATED` reconciliation and `GREEN_STALE` production truth to coexist with otherwise green provider health.

A second defect existed in the autonomous replay-window optimizer. After a 12-hour replay window had already been promoted and production-read back, the next run used 12 hours both as champion and challenger because 12 is the configured floor. The predicate requiring the challenger window to be smaller could therefore never pass, recreating `INSUFFICIENT_REPLAY_EVIDENCE` despite 51 observations, zero missing material fingerprints and an already proven promotion.

## Permanent fix

PR #2440 adds one server-only terminal health view and a five-minute reconciler. It may automatically requeue only internal work that is explicitly side-effect-free and still `NOT_STARTED`. A stale green is re-evaluated through the existing canonical production-truth function. Escalated reconciliation, stale planned work and stale-green truth prevent `control_plane_healthy=true`.

The replay optimizer now treats an already-promoted 12-hour safe floor as an idempotent terminal no-op. It does not manufacture a smaller unsafe candidate and does not reopen the completed optimization.

No obligation is marked fulfilled merely to make dashboards green. External evidence boundaries—MFA, credential rotation, DR proof, provider readback, real-user metrics and business outcomes—remain visible until their real evidence exists.

## Prevention

`GREEN_STALE_IS_NEVER_TERMINAL`; `ESCALATED_RECONCILIATION_BLOCKS_HEALTHY`; `STALE_PLANNED_WORK_BLOCKS_HEALTHY`; `ONLY_SIDE_EFFECT_FREE_INTERNAL_WORK_MAY_BE_AUTO_REQUEUED`; `NO_OBLIGATION_MAY_BE_AUTO_FULFILLED_WITHOUT_OUTCOME_EVIDENCE`; `PRODUCTION_HEALTH_AND_PREVIEW_BRANCH_HEALTH_ARE_SEPARATE_SIGNALS`; `PROVEN_OPTIMIZATION_FLOOR_IS_TERMINAL_NO_OP`.

## Release truth

This document records candidate learning. The status becomes LIVE & BEWEZEN only after exact-head protected checks, protected merge, the same versioned migrations on Supabase production, active cron readback and functional runtime readback.
