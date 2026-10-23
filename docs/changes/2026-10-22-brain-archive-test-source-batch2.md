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


## Append-only historical migration prefix repair

Full exact-head BRAIN run [#39763894940](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39763894940): 3,531 tests, 3,185 pass, 346 fail. The new source path repairs removed 12 earlier failing test keys, while 37 new failures emerged on the advanced baseline. Three old tests falsely required the actively growing canonical migration ledger to remain at exactly 568/603/607. The first 603 historical entries, the original 607th record and 568th boundary were independently read back from the current 634-entry lock before modifying any assertions. Tests now require a monotone history, retain exact original historical prefix/boundary and preserve migration-identity and security assertions. No migration data/files touched. Full revalidation pending.

## Extended archived SQL source recovery batch 3
- 8 additional inherited tests; 8 exact original SQL read-path references; 8 new Git blob-identity regressions
- Full BRAIN before: run #39764575433: 3,531 executed, 343 failed; no postchange claim until next independent execution
- No migrations restored into live SQL execution; assertion logic preserved
- `tests/brain-autonomous-improvement-floor-terminal-v1.test.mjs` reads immutable `20260920095700_autonomous_improvement_floor_terminal_v1.sql` (de5bc791c06080d2da3da8cc21c52bb808eebdad)
- `tests/brain-company-intelligence-os-v1.test.mjs` reads immutable `20260928193000_powerhouse_company_intelligence_os_v1.sql` (a4758905425f0964338371247343192e3ed4cd73)
- `tests/brain-control-plane-monotonic-terminal-v1.test.mjs` reads immutable `20260918141000_powerhouse_control_plane_monotonic_terminal_v1.sql` (d005ca4d3d0aeef45ffe4efe06a414f9377d8bf3)
- `tests/brain-one-million-revenue-operating-contract-v1.test.mjs` reads immutable `20260929162000_powerhouse_one_million_revenue_operating_contract_v1.sql` (f37aa930e2f2b89602a6878fc4714a88c5e46392)
- `tests/brain-rocket-revenue-event-spine-v1.test.mjs` reads immutable `20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql` (ec95d7199b06974bb0e3cbe31c1c74407024e292)
- `tests/brain-social-publish-atomic-claim-dedupe-v1.test.mjs` reads immutable `20260917235907_social_content_integrity_invalidation_guard.sql` (c653d64b4724fb654f610effd2ce6422c17269e9)
- `tests/brain-terminal-autonomous-reconciler-v1.test.mjs` reads immutable `20260920095500_terminal_autonomous_reconciler_v1.sql` (bc0cbe3c7a830c13872cf5bc4cb1f858c37f0a32)
- `tests/brain-trigger-based-mkb-acquisition-runtime-v1.test.mjs` reads immutable `20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql` (a6037047760fe281ab24298f9f7d94c62cc95695)

## Additional SQL contract recovery batch 4
- 4 test files and 4 retired-path reads mapped to identical Git archive blobs
- Existing business/security assertions preserved; no DDL/SQL migration execution or permission change
- Full BRAIN independent replay required before declaring any fixed-count reduction
- `tests/supabase-powerhouse-commercial-closed-loop.test.mjs`: `20260915133500_powerhouse_commercial_closed_loop_v2.sql` (c4f587bd451da135fc4a2d9b4009cb53689eef5d)
- `tests/supabase-powerhouse-data-intake-contract.test.mjs`: `20260915131500_powerhouse_data_intake_health_v1.sql` (84c4a40ebd15cbbc2054dbde344965b76e69a677)
- `tests/supabase-powerhouse-rocket-revenue-event-spine-v1.test.mjs`: `20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql` (ec95d7199b06974bb0e3cbe31c1c74407024e292)
- `tests/brain-powerhouse-observability-outcome-contract.test.mjs`: `20260915203000_powerhouse_observability_outcome_calibration_closure_v1.sql` (04a105cba63d24f69c8ff7290fdffb7a4e6b3119)
