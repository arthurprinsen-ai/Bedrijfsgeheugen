# BRAIN historical SQL source contract recovery — 22 October 2026

Obligation-ID: ci-brain-archived-source-batch2-20261022
Parent-P0: #3742
Related-P0: #4215

Source: independent BRAIN run 39671036043, job 119469063095: 3,511 tests / 3,190 passed / 321 failed. This is a candidate, **not** a passing suite or proof of reduction.

Scope: 10 test files, 12 obsolete SQL source occurrences. Each original SQL Git blob was verified in the existing repository-only migration-history directory. Change only source read paths; preserve all assertions. New regressions fail if an old path returns, a nonempty archived SQL blob changes, or a duplicate SQL migration becomes executable.

- `tests/brain-instagram-mira-winner-selection-v1.test.mjs`: 3 path(s) to `20260920110000_instagram_daily_winner_lineage_v1.sql` (Git blob `d66c4119fe0e75a4622f35fd7d420f31bd7dadf8`)
- `tests/brain-human-commercial-orchestrator-v1.test.mjs`: 1 path(s) to `20261005135000_powerhouse_human_commercial_orchestrator_v1.sql` (Git blob `18876bf5a51efe00d948f6652899477535b910a4`)
- `tests/brain-powerhouse-need-discovery-v1.test.mjs`: 1 path(s) to `20260930202000_powerhouse_need_discovery_v1.sql` (Git blob `90c466274bcbf1b368e361e461231530efda3570`)
- `tests/brain-supabase-capture-trigger-execute-security-v1.test.mjs`: 1 path(s) to `20260919123730_restrict_capture_trigger_execute_v1.sql` (Git blob `6121995f1ca3727d47fa96e0e5b67817d745fc31`)
- `tests/supabase-powerhouse-autonomous-trigger-fix.test.mjs`: 1 path(s) to `20260915123500_powerhouse_autonomous_growth_revenue_trigger_fix.sql` (Git blob `36e819b3903dc41528072454c79a17cabab5513b`)
- `tests/supabase-powerhouse-autonomy-rpc-security.test.mjs`: 1 path(s) to `20260915104000_powerhouse_autonomy_rpc_security_hardening.sql` (Git blob `5a2433a155f965f085f5d7ea1dee6a996e30d3c2`)
- `tests/supabase-powerhouse-internal-view-security.test.mjs`: 1 path(s) to `20260915110000_powerhouse_internal_view_security_hardening.sql` (Git blob `1aa3033564c25892814853701662c3ab104f0c0c`)
- `tests/supabase-powerhouse-gap-register-security.test.mjs`: 1 path(s) to `20260915110500_powerhouse_gap_register_security_hardening.sql` (Git blob `2de1cf82e52aafae97deb132302400095dc7b1e1`)
- `tests/supabase-powerhouse-linkedin-sales-prediction-activation.test.mjs`: 1 path(s) to `20260915125800_powerhouse_linkedin_sales_prediction_activation_v1.sql` (Git blob `8daf835dc5ff3f79fc11c7c4505755b436ed9522`)
- `tests/supabase-powerhouse-signal-forecast-materialization.test.mjs`: 1 path(s) to `20260915124500_powerhouse_signal_forecast_materialization.sql` (Git blob `8610fdc4adafb5c3193cab5d2775a050e3f632dd`)

No production SQL, DDL, RLS, ACL, tenant data, browser policy, scheduler, publisher or provider is modified. Existing PRs #4605, #4608 and #4617 remain separate and unchanged. Required CI, CodeQL, focused test execution, independent complete zero-failure BRAIN, Supabase #3742 clean-room parity, and #4215 real authenticated tenant tests are not waived. Merge only with applicable exact-head proof.
