# 2026-11-05 — Heartbeat native decision authority preserved in original source

**Owner:** original `powerhouse-runtime-scheduler-mux-v1 / data-spine-watchdog`  
**Parent:** #4198  
**Fingerprint:** `powerhouse|heartbeat|native-decision-overwritten-by-generic-cron-receipt|20261105-v1`  
**Status:** protected SQL candidate; not production-verified until native provider migration and next natural scheduler/readback.

**Observation (Supabase production):** Cron #171 ran original data-spine watchdog at 15:31:00.023207 UTC. Five source-native stages initially matched exact timestamp and `unhealthy_sources=0`. Original general assurance synchronization afterward replaced the `decision` with generic cron-success evidence `scheduled_policy_execution` timestamp 15:31:02.419347, thereby losing original `decision_kind` and the true source timestamp despite status GREEN.

**Why:** Generic cron promotion used later cron end timestamp and replaced the stronger source-owned decision row. The source-native watchdog itself was correctly fixed and deployed under protected #5450, but shared receipt reconciliation eroded the independent proof.

**Repair:** Do not emit generic cron-success `decision` for `data-spine-watchdog`; preserve every existing cron input, readback, other original loop and security boundary. SQL migration `20261105153700_original_data_spine_decision_source_priority_v1.sql`.

**Regression/learning:** `tests/brain-data-spine-decision-source-priority-20261105.test.mjs`, `brain/learning/2026-11-05-data-spine-native-decision-receipt-source-priority.json`. Learning required historical replay + canary green before admission. Original three source fingerprints remain unchanged.

**Independent terminal requirements:** exact-head Required/CodeQL and native Supabase Preview green; protected main merge; provider applied migration #809; read original function definition; next natural original #171 ten-minute source tick; following assurance refresh preserves decision.evidence_type=`original_watchdog_same_tick_source_truth`, its `decision_kind`, and exactly matching `source_check_at` across action/outcome/learning/guard. No independently verified business revenue, provider post, lead or customer outcome may be inferred from stage GREEN.

**Prevention:** Source-native evidence outranks generic scheduler status, not by changing color rules or suppressing errors, but by protecting the sole authoritative writer. No duplicate cron, agent or post.
