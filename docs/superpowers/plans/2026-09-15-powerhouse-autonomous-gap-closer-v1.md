# Powerhouse Autonomous Gap Closer v1 — Implementation Plan

**Goal:** close structural execution, forecast, calibration, experiment and outcome-readback gaps in the existing Powerhouse.

- [x] Extend canonical policy with autonomous gap-closing semantics and truth boundary.
- [x] Add `powerhouse_gap_register_v1` and `powerhouse_autonomous_gap_closer_v1(date)` using existing Powerhouse stores/engines.
- [x] Schedule hourly cron at minute 22.
- [x] Normalize flywheel health lifecycle states and distinguish managed pending external outcomes from unmanaged gaps.
- [x] Harden SECURITY DEFINER functions with deterministic search path and service-role-only execute; set gap-register view to security invoker.
- [x] Apply and manually verify canonical Supabase production migration.
- [ ] Require exact-head GitHub security/preflight/required/BRAIN gates green.
- [ ] Merge PR only after green exact-head verification.
- [ ] Require Netlify production `ready` with exact merge SHA.
- [ ] Persist/read back activation runtime event and learning.

No business outcome, realized revenue, no-response state or experiment winner may be fabricated to satisfy health checks.