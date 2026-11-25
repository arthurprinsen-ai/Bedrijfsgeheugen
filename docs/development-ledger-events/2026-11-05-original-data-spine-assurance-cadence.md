# 2026-11-05 — One Brain source-cadence root cause, original Health/Portal reporting

- Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|heartbeat|original-data-spine-10m-source-vs-30m-assurance-bridge-stage-stale|20261105-v1`.
- Production observed UTC 13:18: source input ~4.3m, measurement/readback ~7.3m, action/guard/learning/outcome ~25.3m; actual source guard pass true but original assurance AMBER because stale stage. Zero genuinely unhealthy original data-spine source rows.
- Existing owner `powerhouse_data_spine_watchdog_v1` executes every 10m in original `powerhouse_runtime_scheduler_mux_v1`, original cron #171. Original regression bridge runs only at :23/:53, every 30m.
- Actual source change: same original watchdog only, writes four observation receipts with real p_now and exact health count, fail-closed on unhealthy source; explicit no customer outcome, no causal attribution, no new scheduler/provider.
- Migration `supabase/migrations/20261105132000_original_data_spine_same_tick_stage_receipts_v1.sql`; lock row 807 in `supabase/migration-history.lock.json`, same protected PR; regresstest `tests/brain-data-spine-original-ten-minute-stage-proof-20261105.test.mjs`, agent SkillOps original self-improvement skill.
- Remediation acceptance after protected merge: actual native migration identity + function source, original next natural 10m watchdog and assurance run + guard + fresh evidence + ONE BRAIN readback. Real social content, customer conversion, 3477 prediction resolutions and Stripe remain separate open incidents. No false green.
