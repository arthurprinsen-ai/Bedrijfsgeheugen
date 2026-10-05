#!/usr/bin/env python3
import re
import subprocess
import sys
from pathlib import Path

CREATE_TABLE = re.compile(r"create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)", re.I)
CREATE_VIEW = re.compile(r"create\s+(?:or\s+replace\s+)?view\s+public\.([a-zA-Z0-9_]+)", re.I)
CREATE_FUNCTION = re.compile(r"create\s+(?:or\s+replace\s+)?function\s+public\.([a-zA-Z0-9_]+)\s*\(", re.I)
SECURITY_DEFINER = re.compile(r"security\s+definer", re.I)

# Immutable production-ledger mirrors can predate this security gate. They are exempt
# only while their Git blob is byte-for-byte the reviewed production statement.
# Any edit changes the blob SHA and immediately restores normal fail-closed checking.
HISTORICAL_PRODUCTION_MIRROR_BLOBS = {
    "supabase/migrations/20260914074356_powerhouse_channel_decisions_v1.sql": "007e553a7942f23b522fdc467f233b204a1df5d1",
    "supabase/migrations/20260914074533_powerhouse_content_artifacts_v1.sql": "c095809ae53dae8add2ff53d5ee1f989a867d547",
    "supabase/migrations/20260914074405_powerhouse_execution_status_v1.sql": "7a0efd8f35327b49bf239ba244d844e0b01476f8",
    "supabase/migrations/20260914074413_powerhouse_completion_gate_v1.sql": "b44eb398a2fa14c816d535b0842aa36dae4a8fee",
    "supabase/migrations/20260914074434_powerhouse_execution_guard_cron_v1.sql": "e7dab9a5fc50f1b8870ded1b1e5e1a3fbaccc06b",
    "supabase/migrations/20260914074504_powerhouse_completion_gate_compatible_v2.sql": "f34e01ad3b293463467ebbf673a015c111d9a041",
    "supabase/migrations/20260914081052_predictive_intelligence_first_mover_v1.sql": "ab6713e1057da039a7f1725a7bc05116a46299c7",
    "supabase/migrations/20260914081911_predictive_first_mover_contract_v1_hardening.sql": "1324acc5f67238980ef5f31dad91df7aaeefdf94",
    "supabase/migrations/20260914082435_predictive_first_mover_obligations_and_guard_v1.sql": "a18a4ee8fa018d5dd06621a7ea3fd9a52a54fa2a",
    "supabase/migrations/20260914084525_powerhouse_execution_status_due_time_guard_v1.sql": "562031c94b72de23e05c1098dfe5b50c2cd9711a",
    "supabase/migrations/20260914084630_powerhouse_social_delivery_reconciliation_v1.sql": "71b9b92fb598338b75061ba61f861fbbe9a4cc23",
    "supabase/migrations/20260914100133_unified_content_publication_operations.sql": "8f3551c066bedecf2558b789a539828dd3f77d79",
    "supabase/migrations/20260915091805_powerhouse_publication_live_proof_guard.sql": "a093fed12ea8bdbb0ca8ce947b005b4d0cb5b63d",
    "supabase/migrations/20260915094213_linkedin_personal_identity_hard_gate_v3.sql": "4d301683afb61dcf65de24aa86919519594a1d46",
    "supabase/migrations/20260915101047_harden_security_definer_views_and_internal_rpcs.sql": "37eb1ec0cc26667c77763b7226b251fe4351b2cb",
    "supabase/migrations/20260915102437_powerhouse_revenue_flywheel_v1.sql": "39de474008ead1209ca9c17ae3777d94aeae1a51",
    "supabase/migrations/20260915102851_powerhouse_autonomous_growth_revenue_v1.sql": "dd82c03753fcc84a399c02dec537b9c9a3d42f77",
    "supabase/migrations/20260915102925_powerhouse_autonomous_growth_revenue_v1.sql": "75c8d7cd567d2be8e55b676865414f280345c184",
    "supabase/migrations/20260915123725_powerhouse_full_cycle_production_proof_v1.sql": "ea3d8b5a0ddb48da4fba6a3b27d1d44010cbef53",
    "supabase/migrations/20260915183418_resource_factor_registry.sql": "bec13320a565c7a56e4babd97c550690e11aa9ed",
    "supabase/migrations/20260915183554_resource_factor_provenance_fields.sql": "4780a3870a999e8498d2c17715108af6816fc431",
    "supabase/migrations/20260915183603_resource_impact_projection_v1.sql": "18a5cf26946868e5fb02772bc9577b4e135ff722",
    "supabase/migrations/20260915183656_resource_impact_exclude_retired_make.sql": "04bd67a741dd555eb41f1c9993455f22cbe70de2",
    "supabase/migrations/20260916091505_powerhouse_structure_hygiene_v2.sql": "ca3990e16fb7d500af1564d38f06ff52717e8621",
    "supabase/migrations/20260917135620_close_cockpit_execution_outcome_feedback_loop_v1.sql": "f1742f1c57136f4c02e2dd36a5881e2ba008fd41",
    "supabase/migrations/20260917135656_close_cockpit_execution_outcome_feedback_loop_v2.sql": "a50a209bf8ff6eeef412b069a962324e3e363d8c",
    "supabase/migrations/20260917140700_offers_evidence_source_heartbeat_v1.sql": "1fe448278b7b9d1c4525c92d2f6f78655dba365e",
    "supabase/migrations/20260917140900_full_cycle_gmail_canonical_evidence_source_v1.sql": "80547faa8053cf8d4f105f2979ac329ebe6e737b",
    "supabase/migrations/20260913133014_channel_identity_hard_gate_v3_contract.sql": "ca2707cf03cfd13532bacc63e358e4d6362922d2",
    "supabase/migrations/20260913133026_arthur_personal_linkedin_identity_v4_contract.sql": "196df97b31fa20033bbdc3c71c6d2b362b69bef4",
    "supabase/migrations/20260913133209_arthur_personal_identity_v4_runtime_recovery_obligation.sql": "8b62efa898325335d20c679290971b463f079e8f",
    "supabase/migrations/20260914074427_powerhouse_execution_guard_v1.sql": "1d9f896f97a724612cd79b5154c1ec343c8549b1",
    "supabase/migrations/20260914074617_powerhouse_content_orchestrator_cron_v1.sql": "1c993cf23bcd23fa70e052770abdeaea052e155f",
    "supabase/migrations/20260914074656_powerhouse_orchestrator_timeout_v2.sql": "eaeff4c607f7951dcfa995b4bfea3e28b3adcc2f",
    "supabase/migrations/20260914075107_powerhouse_social_publisher_cron_v1.sql": "bb3c41f0e4674d9143180ef0af77a046d240e592",
    "supabase/migrations/20260914075546_powerhouse_execution_guard_promote_v2.sql": "4741e329b9299086f4a244c9dd994ebde39ccfc4",
    "supabase/migrations/20260914075848_powerhouse_blog_queue_cron_v1.sql": "84fcb94fb888d104475758f55c8507fe4f59ab9c",
    "supabase/migrations/20260914080058_disable_inaccessible_powerhouse_blog_queue_cron_v1.sql": "6cbc0245cd35b5289b5433f72f5aeab2bb2c8575",
    "supabase/migrations/20260914093117_powerhouse_cockpit_outcome_lineage_v1.sql": "e9c0e218d0198b721ac04f1e6121422195fc02b7",
    "supabase/migrations/20260915082029_content_publication_daily_watchdog_20260915101500.sql": "20673f17b2270777c319123bbdac43c284c8df26",
    "supabase/migrations/20260915082107_content_publication_watchdog_dst_safe_20260915.sql": "00012ee19b7d12e397fe0a8b4ea25fa786b5aec0",
    "supabase/migrations/20260915100715_powerhouse_internal_rls_hardening.sql": "9b33c67285f622d92724a37bc5e194ee0511dcff",
    "supabase/migrations/20260915102747_powerhouse_revenue_flywheel_v1_schedule.sql": "2a51f3c8b2b4bfb0f5473b45d2e3a602d05aec71",
    "supabase/migrations/20260915103324_powerhouse_autonomous_growth_revenue_trigger_fix.sql": "a700d3051267c2516c46f71ba2da3603f122210e",
    "supabase/migrations/20260915123500_powerhouse_autonomous_growth_revenue_trigger_fix.sql": "d77259adcb978dbca903cce1d081ea2dafe3f56a",
    "supabase/migrations/20260915103331_powerhouse_autonomous_growth_revenue_bootstrap_after_trigger_fix.sql": "f3582c4732c2dfd02c839baed7088eb990448b67",
    "supabase/migrations/20260915103758_powerhouse_autonomy_rpc_security_hardening.sql": "a0dd6030c3746c250ecbeaec08ba1098736118fd",
    "supabase/migrations/20260915104421_powerhouse_signal_forecast_materialization.sql": "47e5acd65cbef5bccdf54a43400997c2b4be3a4d",
    "supabase/migrations/20260915104431_powerhouse_autonomous_growth_revenue_bootstrap_after_signal_forecasts.sql": "f3582c4732c2dfd02c839baed7088eb990448b67",
    "supabase/migrations/20260915104619_powerhouse_linkedin_sales_intelligence_v1.sql": "6c0861f3d1ad8bfae6d5fdebc5b11ccc03921e50",
    "supabase/migrations/20260915104823_powerhouse_linkedin_sales_prediction_activation_v1.sql": "8daf835dc5ff3f79fc11c7c4505755b436ed9522",
    "supabase/migrations/20260915105139_powerhouse_autonomous_gap_closer_v1.sql": "d3ae491edef5e4513726562060a81a6e06e212da",
    "supabase/migrations/20260915105255_powerhouse_internal_view_security_hardening.sql": "413c65f7c69b82c3bbed2d341705441bc5b42407",
    "supabase/migrations/20260915105319_powerhouse_flywheel_health_semantics_v2b.sql": "1b5626a19e6802a472579b20862bad7b64c0488c",
    "supabase/migrations/20260915105833_powerhouse_autonomous_gap_closer_security_hardening_v1.sql": "6d17b92cfb8c881b7e6c603251c57ae449144e34",
    "supabase/migrations/20260915105917_powerhouse_gap_register_security_invoker_v1.sql": "af562c161b7997f05840ba23d4b08ea5c4cb152a",
    "supabase/migrations/20260915110131_powerhouse_gap_register_security_hardening.sql": "2a5a7070625c62d213ca4670c12e269dc3907c3c",
    "supabase/migrations/20260915110214_powerhouse_gap_register_security_hardening.sql": "2a5a7070625c62d213ca4670c12e269dc3907c3c",
    "supabase/migrations/20260915110826_powerhouse_data_intake_health_v1.sql": "59b9a41c796f7d0fdd6360f2e04f14af56cce4de",
    "supabase/migrations/20260915110904_powerhouse_data_intake_health_v1_status_fix.sql": "b06d8beafc6ac56338f97c5201598f0b3d395f8c",
    "supabase/migrations/20260915111057_powerhouse_data_intake_health_v1_forecast_timestamp_fix.sql": "aa87352af0c8733040701f325209ae7395baa63a",
    "supabase/migrations/20260915111142_powerhouse_data_intake_health_v1_runtime_state_fix.sql": "d3e09d71b0832ccdfac9af2c8f14c05c28e4b3ea",
    "supabase/migrations/20260915111737_powerhouse_data_intake_health_v1_execute_hardening.sql": "615977e7d38c84e230a7d4d3e65956f7f026784d",
    "supabase/migrations/20260915111958_powerhouse_commercial_learning_v1.sql": "3dd48ad877c37e4b6df58f3baadb5d2d3c598233",
    "supabase/migrations/20260915112209_powerhouse_commercial_learning_feedback_views_v1.sql": "d9e5a689c90972d47472e3f213cf3a62a0a8d2e9",
    "supabase/migrations/20260915112241_external_feed_async_cron_split_v1.sql": "fa9f2c7b2dd89d8e43202325400ebee8489bb44f",
    "supabase/migrations/20260915112519_external_feed_health_bridge_v1.sql": "747b8b11bbfa9af5808074e54587f83a0736ad47",
    "supabase/migrations/20260915112611_powerhouse_commercial_learning_explicit_view_security_v1.sql": "76fe4d0b08fbcfd9ef31b68686dd694931b0d208",
    "supabase/migrations/20260915114556_powerhouse_commercial_closed_loop_v2.sql": "ad2ab54e6a7d3556df0707db94b4284a699450d7",
    "supabase/migrations/20260915130251_ga4_auth_failover_v1.sql": "771c22d455fdbe159ef7740bb273b6b09cc3cf32",
    "supabase/migrations/20260915135825_powerhouse_full_cycle_health_status_fix_v1.sql": "881da84a2fa0ecde4ac81335d2c42f7f0f332706",
    "supabase/migrations/20260915140053_powerhouse_full_cycle_status_normalization_v1.sql": "5b9c158cc6e473074283e866f9bfbfbd8401eae8",
    "supabase/migrations/20260915140402_powerhouse_forecast_calibrator_hourly_v1.sql": "8fbfedd48f3c7c49cbc8ad9885bd2c71e2cdb50f",
    "supabase/migrations/20260915140800_powerhouse_forecast_calibrator_timing_gap_fix_v1.sql": "b2dcfb81a3773363fba0bf177bc34c27183cc318",
    "supabase/migrations/20260915144949_powerhouse_execution_learning_closure_v1.sql": "26424098d48a9f5a9f2eae49467a412518cffc4a",
    "supabase/migrations/20260915145008_powerhouse_full_cycle_consolidation_v1.sql": "18418296221bf177325c6d1632ee7da9f7466711",
    "supabase/migrations/20260915152009_powerhouse_full_cycle_health_status_canonicalization_v1.sql": "8553a2d5d807c1a3407a7ae7100e6153dbd1ab0d",
    "supabase/migrations/20260915161019_brain_transition_obligation_atomic_cas_v2.sql": "c0169e7f2c4ef7687237d29feeb5f4f824fdbbf0",
    "supabase/migrations/20260915161322_brain_transition_obligation_atomic_cas_v2_security_contract.sql": "904fedf3ead35ae495b485fbaff852482825bcff",
    "supabase/migrations/20260915165017_powerhouse_tenant_identity_hardening_v1.sql": "34a85dda42daaec80550885db7067f2bc20d295b",
    "supabase/migrations/20260915181119_powerhouse_canonical_scan_loop_v1.sql": "9c196428ec23ebe716bb40ee2cfd634d2e9c7dd0",
    "supabase/migrations/20260915182506_powerhouse_canonical_scan_loop_v1_security.sql": "c67513b1f9b4e55f5fdbb5cf5f591d178528fe11",
    "supabase/migrations/20260915183620_resource_impact_view_security_invoker.sql": "6d7e1628641c874e0cb03b79c703d6d38c160d1e",
    "supabase/migrations/20260915184510_resource_usage_canonical_ingest_v1.sql": "9e0b77c25c490a69120b3ab4c29c8e29ba8c71c4",
    "supabase/migrations/20260915184725_resource_usage_canonical_ingest_digest_fix.sql": "a49473ce1b9cb4e38b41de3e229ca2c4c24d3726",
    "supabase/migrations/20260916053253_powerhouse_public_rls_regression_guard.sql": "a25f60bdc14f369745fb13710c0e135bb12476a4",
    "supabase/migrations/20260916053300_harden_bg_klik_vastleggen_execute.sql": "3af37f50efc6dc38fc56555300168a57bd9c911c",
    "supabase/migrations/20260916071237_powerhouse_observability_outcome_calibration_closure_v1.sql": "04a105cba63d24f69c8ff7290fdffb7a4e6b3119",
    "supabase/migrations/20260916071512_powerhouse_observability_views_service_role_select_only.sql": "519b7cdd95592bf91e4075b37d2509871ffcc5c4",
    "supabase/migrations/20260916092402_powerhouse_structure_hygiene_v3_server_only_grants.sql": "c70bbec4b7cd2b5c952f03edb492a971cc037e8c",
    "supabase/migrations/20260916092613_powerhouse_structure_hygiene_v4_drop_unused_growth_attribution_index.sql": "4f11a1e2e0f11558d1065c1149134c9a41788d68",
    "supabase/migrations/20260916130010_social_delivery_identity_readback_guard_v1.sql": "e982df75333b4dd853ab17a2ac1eb320ba79ac4d",
    "supabase/migrations/20260916131217_autonomous_improvement_production_cycle_v1.sql": "6aa699b516bc24cf02f63b22feaf6c6b7b835f2f",
    "supabase/migrations/20260916132201_autonomous_improvement_brain_taxonomy_fix_v1.sql": "e9eb6ceb900bea29a7596aed0205f810481655ea",
    "supabase/migrations/20260916133208_fix_autonomous_improvement_record_kind_v1.sql": "9f76040f6607ac6e77201ed242522107ca35809c",
    "supabase/migrations/20260916144238_autonomous_improvement_completion_runtime_v1.sql": "bda02267339b9ae54979c59fedf8e6dbb7b5af2a",
    "supabase/migrations/20260916144252_autonomous_improvement_pgcrypto_search_path_fix_v1.sql": "ebf901a192fdd318ea82ac4dfffc6a4eda3adc3f",
    "supabase/migrations/20260916144312_autonomous_improvement_recovery_proof_hardening_v1.sql": "7cc561ff3774d1a4ebfb87eb9d5f5d4e7b841a2b",
    "supabase/migrations/20260916161635_autonomous_improvement_currentstate_record_type_fix_v1.sql": "9996dc70ce0099a40d143b6ce228335bae78b8bd",
    "supabase/migrations/20260916172554_content_operations_cockpit_projection_repair_v1.sql": "1625ba3c414e76a86031cb8741a6c5ecafe696c3",
    "supabase/migrations/20260916190120_powerhouse_security_operations_hardening_v1.sql": "e729de2cde4a618a8562c1de51e92781077408c8",
    "supabase/migrations/20260916190521_reconcile_daily_sales_action_set_v1.sql": "af65b2596e33e601d86deea05e0f58d7d18a6a50",
    "supabase/migrations/20260916190733_reconcile_daily_sales_action_set_v1_status_fix.sql": "4bef3efbeeb94a748ecd7223b1ceafe1dcbc3b3d",
    "supabase/migrations/20260916190848_reconcile_daily_sales_action_set_v1_atomic_batch.sql": "0eb06de6fd5adffb1329858375b350c15f94569b",
    "supabase/migrations/20260916190951_reconcile_daily_sales_action_set_v1_immutable_selection.sql": "63b094df2ff3592e5c42dd82fd9bb9dc6bce2abc",
    "supabase/migrations/20260916194336_daily_sales_reconciler_security.sql": "c2224dd3cdf27e1692929b893c68d77259db1215",
    "supabase/migrations/20260916194803_legacy_make_learning_to_canonical_supabase.sql": "10c932bd94195cd11ce506ce289ae26c56cf8be1",
    "supabase/migrations/20260917070302_linkedin_company_daily_delivery_guard_v1.sql": "4c4c0f7cebecff27f1e3778a4b15026a60c2c7b4",
    "supabase/migrations/20260917083113_powerhouse_daily_autonomy_guards_v1.sql": "149aa8e7c409b95936aaef495916c5e35412721d",
    "supabase/migrations/20260917084456_instagram_daily_delivery_guard_v1.sql": "cf0b365d732e9f05d059718ea38bea971189ac1a",
    "supabase/migrations/20260917084841_powerhouse_execution_resilience_v1.sql": "75670afe68cd75654f5d00f95164b40c01f34ce7",
    "supabase/migrations/20260917085200_powerhouse_execution_resilience_watchdog_schedule_v1.sql": "8c4109eff70aa2489144bf977a40d4f039717409",
    "supabase/migrations/20260917085739_instagram_exact_final_media_evidence_contract_v1.sql": "6da6f5650d8ea4613ac26e3cb3c79c554148d8fc",
    "supabase/migrations/20260917094812_powerhouse_resource_intelligence_v1.sql": "51c13c5c298523278dad440da8dbbbc3ab11c977",
    "supabase/migrations/20260917094941_powerhouse_resource_intelligence_v1.sql": "51c13c5c298523278dad440da8dbbbc3ab11c977",
    "supabase/migrations/20260917102906_content_closed_loop_reconciliation.sql": "c7a5d75a3d2ad92a78d7913902044ce64fd410c1",
    "supabase/migrations/20260917102917_content_closed_loop_scheduler.sql": "c431d45a5b88292086cec949e35674305d3782c2",
    "supabase/migrations/20260917102926_autonomous_improvement_immutable_identity_fix.sql": "2aa03c655826462585dcb2e5fe3c4c058e3d6559",
    "supabase/migrations/20260917102940_content_closed_loop_runtime_schedule.sql": "e0bc3ad88a675e67840d5cd05d5bdbdbbf500397",
    "supabase/migrations/20260917134324_close_execution_reconciliation_worker_gap_v1.sql": "2dd6a0cafeff84fddcf4f6a36771d8a3e3f39362",
    "supabase/migrations/20260917140619_offers_evidence_source_heartbeat_v1.sql": "1fe448278b7b9d1c4525c92d2f6f78655dba365e",
    "supabase/migrations/20260917140857_full_cycle_gmail_canonical_evidence_source_v1.sql": "80547faa8053cf8d4f105f2979ac329ebe6e737b",
    "supabase/migrations/20260917142022_enforce_instagram_exact_final_media_gate_v1.sql": "048d113f9bb97d0a982cf959c6f014c106da351a",
    "supabase/migrations/20260917142220_prevent_content_ready_state_regression_v1.sql": "1ae7944e4d3770e9ff1fee17f756b757a84e6741",
    "supabase/migrations/20260917142802_linkedin_personal_verified_truth_schedule_guard.sql": "423981f51208d2d1d54a8a95235286212e2ea170",
    "supabase/migrations/20260917150525_universal_control_plane_binding_v1.sql": "ea4a24e064d777a8d6c441293c4a68eb9fe18b43",
    "supabase/migrations/20260917150551_universal_control_plane_binding_digest_fix_v1.sql": "bc25907d2c6d7b6a85afc2e61ddc7f15ac0b4534",
    "supabase/migrations/20260917181939_restrict_security_definer_rpc_execute_v1.sql": "27a3e10196f829a426f5e2bef4e8211b5e60295c",
    "supabase/migrations/20260918053605_powerhouse_daily_content_no_gap_fallback_v1.sql": "fec018104664684367945e1dedf6961e59de692b",
    "supabase/migrations/20260918053949_powerhouse_completion_layer_v1.sql": "5571577a71523e4bef09405a781df392eefae405",
    "supabase/migrations/20260918054428_recover_completion_calibration_identity_v1.sql": "4aebd4c5e5a66fb030a4aea0b7fdf48afcf5593c",
    "supabase/migrations/20260918060214_secure_bg_roep_functie_powerhouse_token_v1.sql": "33c8600b202f1ada429d73769071807619b0cb5e",
    "supabase/migrations/20260918073620_media_proof_least_privilege_v1.sql": "7044d60feb50a3bd5adc011a675bcf125dbb72bc",
    "supabase/migrations/20260918074213_runtime_health_truth_v1.sql": "566be90532591f7ede2540c3b9d5f5d684f2fcab",
    "supabase/migrations/20260918074222_runtime_health_truth_v1.sql": "566be90532591f7ede2540c3b9d5f5d684f2fcab",
    "supabase/migrations/20260918074243_media_proof_service_role_only_v1.sql": "2597e66592cd8d75a3d4778e3769ffed46fc8b3e",
    "supabase/migrations/20260918080443_powerhouse_structural_gap_closure_v2.sql": "b709330d66a348cd44a5aac470ce17f90ba2db5f",
    "supabase/migrations/20260918080444_powerhouse_structural_gap_closure_v2.sql": "b709330d66a348cd44a5aac470ce17f90ba2db5f",
    "supabase/migrations/20260918080447_powerhouse_unified_data_intelligence_spine_v1.sql": "b8f754c43c6d872232148a2dee07e3c11c32b8aa",
    "supabase/migrations/20260918080451_powerhouse_dataforseo_intelligence_schedule_v1.sql": "716cdf257c9017aeaaeb5533a0cdbc6bd1b18ec5",
    "supabase/migrations/20260918080502_powerhouse_structural_gap_closure_v2.sql": "b709330d66a348cd44a5aac470ce17f90ba2db5f",
    "supabase/migrations/20260918080504_powerhouse_unified_data_intelligence_spine_v1.sql": "b8f754c43c6d872232148a2dee07e3c11c32b8aa",
    "supabase/migrations/20260918080506_powerhouse_unified_data_intelligence_spine_v1.sql": "b8f754c43c6d872232148a2dee07e3c11c32b8aa",
    "supabase/migrations/20260918080511_powerhouse_dataforseo_intelligence_schedule_v1.sql": "716cdf257c9017aeaaeb5533a0cdbc6bd1b18ec5",
    "supabase/migrations/20260918080513_powerhouse_dataforseo_intelligence_schedule_v1.sql": "716cdf257c9017aeaaeb5533a0cdbc6bd1b18ec5",
    "supabase/migrations/20260918081343_powerhouse_data_spine_heartbeat_truth_v1.sql": "7d292f0c897f14b8b5bedb06ed786b8f0055a222",
    "supabase/migrations/20260918081532_powerhouse_data_spine_heartbeat_truth_v1.sql": "7d292f0c897f14b8b5bedb06ed786b8f0055a222",
    "supabase/migrations/20260918081657_instagram_media_provider_router_v1.sql": "be2ab73733f0e9299515630b11dd477fb3db4b81",
    "supabase/migrations/20260918082002_instagram_reserve_vision_proof_v1.sql": "6fbc98392e5c7c36aafcf96a7e29ff1e6f00c45e",
    "supabase/migrations/20260918083216_instagram_media_job_materializer_v1.sql": "60d161c17b1917ff444dafebe976e0838f9e5f1d",
    "supabase/migrations/20260918085059_sales_action_signal_cycle_materializer_v1.sql": "024fa031562eb1f374da17f00bed9735c13bb2ff",
    "supabase/migrations/20260918085708_tenant_identity_review_semantics_v2.sql": "322fee022b78584346f1970e290e7cf763a1147a",
    "supabase/migrations/20260918090310_legacy_growth_outcome_reconciler_v1.sql": "e84bde6ba753e773e4d74cfb39f226dde9e068e3",
    "supabase/migrations/20260918091355_action_evidence_obligations_v1.sql": "8e48ff68d930f2d33d94092baaa255d2e36d8ca0",
    "supabase/migrations/20260918095007_prospective_autonomous_commercial_experiment_v1.sql": "8bd6f9423ab1665d8e9a0771f51f28c9d3a61ec9",
    "supabase/migrations/20260918095032_prospective_autonomous_commercial_experiment_v1.sql": "8bd6f9423ab1665d8e9a0771f51f28c9d3a61ec9",
    "supabase/migrations/20260918100014_forecast_calibration_health_due_v1.sql": "4828bd5facf452f579b530e2b4332133d978ef7a",
    "supabase/migrations/20260918101248_action_learning_production_truth_v1.sql": "0712bedcf5b12aed3b12e4a732c0361c9ec5c57a",
    "supabase/migrations/20260918101333_bg_opdrachtenradar_nightly_v1.sql": "8df44bd7286dba1442baa80abe3b7384b3f28fb7",
    "supabase/migrations/20260918142616_powerhouse_control_plane_monotonic_terminal_v1.sql": "d005ca4d3d0aeef45ffe4efe06a414f9377d8bf3",
    "supabase/migrations/20260918142628_powerhouse_control_plane_monotonic_terminal_v1.sql": "d005ca4d3d0aeef45ffe4efe06a414f9377d8bf3",
    "supabase/migrations/20260918142630_powerhouse_control_plane_monotonic_terminal_v1.sql": "d005ca4d3d0aeef45ffe4efe06a414f9377d8bf3",
    "supabase/migrations/20260918183426_regulatory_evidence_sources_v1.sql": "e4ee3cd7e47619644ff4bf327830ea06ec3910a0",
    "supabase/migrations/20260918184525_powerhouse_source_observation_immutable_v1.sql": "788569458f402fd271136f7ff1db673f38b69c49",
    "supabase/migrations/20260919123853_restrict_capture_trigger_execute_v1.sql": "70def26152d42c5c55ad2fc2267dbad169b320e5",
    "supabase/migrations/20260920070814_powerhouse_one_brain_reconciliation_worker_v2_health_contract_v1.sql": "a54e5c6048f66e573ec6ad4b8a02d64a401cd0ed",
    "supabase/migrations/20260920073119_bg_roep_functie_request_log_idempotency_v1.sql": "5f4cd7fa414d9e6f448e53f67569c6216ddb2211",
    "supabase/migrations/20260920080740_terminal_autonomous_reconciler_v1.sql": "479e3abceaa318b14945aba9f4162dbe4f04fd4b",
    "supabase/migrations/20260920080742_autonomous_improvement_floor_terminal_v1.sql": "1e3867c5818fcaf5d55523bb134be3b7236a3f1d",
    "supabase/migrations/20260920091107_instagram_daily_winner_lineage_v1.sql": "d66c4119fe0e75a4622f35fd7d420f31bd7dadf8",
    "supabase/migrations/20260920094808_powerhouse_live_system_map_v1.sql": "5e80963fe1bebc06b4eda6db4a6ee32868580315",
    "supabase/migrations/20260920102211_social_publisher_dispatching_state_contract.sql": "60743f2e201e8c1523ca421fefbe36ba5a44a543",
    "supabase/migrations/20260920102646_publication_authority_pgcrypto_qualification.sql": "f7a8b15e73b629012271190d3098ca04d90556cf",
    "supabase/migrations/20260920112118_admin_composio_key_onboarding.sql": "c1053c033f56df7f8296072645ef74ecd41f741a",
    "supabase/migrations/20260921084834_instagram_mira_reel_only_v3.sql": "e15ad83e7d967c9f2ec672343f79a54afb61bca7",
    "supabase/migrations/20260921195716_instagram_meta_oauth_onboarding_v1.sql": "afc8f481ac1a8b1f5884ae6944064da2e09e7f00",
    "supabase/migrations/20260922072213_publication_authority_extension_qualification_recovery_v2.sql": "19b94e64579f845e2144a5535aa1e23e24db7266",
    "supabase/migrations/20260922073123_prevent_personal_linkedin_fallback_source_reuse_v1.sql": "4f9f81a5c016e02cf334389387d3f17089544602",
    "supabase/migrations/20260922074434_social_publication_daily_channel_fence_v1.sql": "88671cf5821b47df55ad9ea63ea3fff154865838",
    "supabase/migrations/20260922082541_instagram_mira_reel_recommendation_normalization_v1.sql": "968b616e88d85cc829b1e4953a45309f64004085",
    "supabase/migrations/20260924073218_powerhouse_seo_opportunity_resolver_v1.sql": "6a9ba57a8a97edf16fee5c21f243ac6729962d40",
    "supabase/migrations/20260924130052_netlify_mcp_oidc_bridge_v1.sql": "535c9150afaae022d4b94b3d526d27bca8a58a33",
    "supabase/migrations/20260924132746_trigger_based_mkb_acquisition_runtime_v1.sql": "a6037047760fe281ab24298f9f7d94c62cc95695",
    "supabase/migrations/20260925075655_mira_continuous_human_video_v1.sql": "eee1da5aebc369522ac891a2745d755ad57f799c",
    "supabase/migrations/20260925080635_close_powerhouse_decision_loops_v2.sql": "36380f0dcba13ad73f491963dbd67face905b88d",
    "supabase/migrations/20260925080744_close_powerhouse_channel_loops_v1.sql": "3fd2903038be33ca919f970a2d631583f5d2b764",
    "supabase/migrations/20260925080801_canonical_social_provider_observations_v1.sql": "3c4f38f67ef2d8c872f921b0c2dd397c4857877d",
    "supabase/migrations/20260925081605_global_post_uniqueness_v1.sql": "710f6cd8c57bd841b7d7e73ae2d546a58a203f94",
    "supabase/migrations/20260925082601_global_post_story_uniqueness_v2.sql": "5e25c456fb6f2bac5fdb91601c3332f0f1ffaa80",
    "supabase/migrations/20260925083651_story_fingerprint_authority_v3.sql": "6153eeb70003d3c4b3df490914d55d53a4dbeebe",
    "supabase/migrations/20260925084112_story_fingerprint_authority_v3.sql": "6153eeb70003d3c4b3df490914d55d53a4dbeebe",
    "supabase/migrations/20260925104622_powerhouse_supabase_migration_readback_name_reconcile_v2.sql": "9f77d59f72d5788747c7fd2f6cd8a40ef4cb1bac",
    "supabase/migrations/20260925122944_terminal_migration_unique_name_reconciliation_v1.sql": "b6eaddf1388e6a0aed9919bd19fd04314c501b8c",
    "supabase/migrations/20260928110707_workshop_scan_preprovision_customer_portal.sql": "291d13d0435d3a8c3c1f9f03653831d7cb968250",
    "supabase/migrations/20260928112442_powerhouse_autonomous_relationship_outreach_v1.sql": "9195a15f3f03e77edc94fe9d6c346b1812afca9c",
    "supabase/migrations/20260928112732_powerhouse_autonomous_relationship_outreach_fix_v1.sql": "9195a15f3f03e77edc94fe9d6c346b1812afca9c",
    "supabase/migrations/20260928112923_powerhouse_autonomous_relationship_outreach_canonical_fix_v3.sql": "f043cf787f2b9bfd6458ce454a15ee164dfaaf97",
    "supabase/migrations/20260928113356_powerhouse_autonomous_outreach_evidence_quality_v1.sql": "59a914ea1e98c7090c1094c6fcd6a9dbb1c65ba7",
    "supabase/migrations/20260928114939_powerhouse_linkedin_sales_machine_v1.sql": "4b56a5333818c81b7e074341182460d3dc45a992",
    "supabase/migrations/20260928114942_powerhouse_linkedin_sales_machine_cycle_v1.sql": "5507619ad8dd309010e12e02eda8c3e1c00a024f",
    "supabase/migrations/20260928115519_powerhouse_linkedin_sales_machine_bounded_query_v1.sql": "08586b93279e44d6e7a6126b4620e804632f1fe0",
    "supabase/migrations/20260928115753_powerhouse_linkedin_comment_relevance_hardening_v1.sql": "69ddbd0baed0253a98720e577b8d7448e1133222",
    "supabase/migrations/20260928121547_social_provider_write_terminal_reconcile_v1.sql": "455dd373c98a27cb3e1fd9e1a1f92a1273ff93bb",
    "supabase/migrations/20260928121746_instagram_terminal_provider_side_effect_trigger_v1.sql": "79bfae9a3845e86806b7d492374850403ef49707",
    "supabase/migrations/20260928122221_social_provider_write_terminal_security_v1.sql": "02342fff4e5c558173676cd9b6020c2c8886449b",
    "supabase/migrations/20260928122435_social_provider_write_terminal_security_explicit_v2.sql": "544d4c8348bc5bc50ebfb2ab766248fb4f71f51a",
    "supabase/migrations/20260928123530_powerhouse_growth_swarm_v1.sql": "e0e34c92aa5f622f6e4d9441f5b79f462eea3e3e",
    "supabase/migrations/20260928124135_powerhouse_growth_swarm_activation_v1.sql": "2b842dc2aa3d2b17ea437b453af3bfef71fdb876",
    "supabase/migrations/20260928124604_powerhouse_growth_swarm_activation_v1.sql": "2b842dc2aa3d2b17ea437b453af3bfef71fdb876",
    "supabase/migrations/20260928133343_powerhouse_persuasion_revenue_optimizer_v1.sql": "d38a9b83f34b3bab104289b28d38c73fdb573004",
    "supabase/migrations/20260928135412_powerhouse_persuasion_growth_optimizer_v1.sql": "e1a587e6b402c091156708929cb0ff5e6c02c012",
    "supabase/migrations/20260928135627_powerhouse_persuasion_growth_optimizer_v1.sql": "e1a587e6b402c091156708929cb0ff5e6c02c012",
    "supabase/migrations/20260928135950_powerhouse_growth_play_action_executor_v1.sql": "10e521c4ec69de7ecb7eb6de244b24263443764c",
    "supabase/migrations/20260928140526_powerhouse_all_20_growth_plays_v3.sql": "7ca00c2443a4e244222a504bbcd4256b49b4641b",
    "supabase/migrations/20260928140907_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql": "08df171c6d4b340c69fda68338e18020f0468422",
    "supabase/migrations/20260928141405_bg_vandaag_manual_dm_handoff_v1.sql": "9f989b5108176fa809e2620ae1081e51ca198fa4",
    "supabase/migrations/20260928142227_bg_vandaag_manual_dm_handoff_security_v1.sql": "b8e59ad344b691d98e7970cd5848a6ed243f48d3",
    "supabase/migrations/20260928153301_powerhouse_relationship_external_intelligence_v1.sql": "ce3e9d346de8274d8356a6ee841c67ad3229e5e0",
    "supabase/migrations/20260928155538_powerhouse_daily_full_connection_enrichment_v1.sql": "c62e125ca13776a639c5c2669ba51743887ca587",
    "supabase/migrations/20260928160019_powerhouse_daily_full_connection_enrichment_v2.sql": "9b49ef6dbd145cbec1d7c5cf010d902855b2673f",
    "supabase/migrations/20260928160452_powerhouse_daily_full_connection_enrichment_v3.sql": "ee5ac9abcd3978cd82048bd3bd7cf77388d69091",
    "supabase/migrations/20260928172712_powerhouse_growth_plays_20of20_repo_parity_v2.sql": "8a9be68cdd44b2ec35cd65c8cdf350279ac5d000",
    "supabase/migrations/20260928175205_powerhouse_company_intelligence_os_v1.sql": "a4758905425f0964338371247343192e3ed4cd73",
    "supabase/migrations/20260928182014_powerhouse_self_improvement_layer_v1.sql": "b62f3195c2f16e20e5be8f6fbb22a19e39dfeee2",
    "supabase/migrations/20260928183018_powerhouse_self_improvement_orchestrator_nonblocking_v1.sql": "c3d66f36cd4420810a119ae6bc0661bb3dd61c25",
    "supabase/migrations/20260928184410_powerhouse_foresight_prediction_intelligence_v2.sql": "8df66b2788d2a391b191502efa3879d1f7246dd7",
    "supabase/migrations/20260928184504_powerhouse_foresight_prediction_intelligence_v2.sql": "bcd3a95e2ec4bee4aab5fc05520b014d69eb21f1",
    "supabase/migrations/20260929121710_schedule_daily_autonomous_outreach_chain.sql": "b9210789aa48d9a4de2658f44ffba822644e0785",
    "supabase/migrations/20260929133241_retire_buffer_as_powerhouse_green_gate.sql": "63d30bf34a110ed4922069a4cf1835b896956f6b",
    "supabase/migrations/20260929133338_workshop_portal_intake_phone.sql": "9fb74017776e5b28754107d05f28f185f37861e1",
    "supabase/migrations/20260929134317_provider_neutral_data_spine_and_notion_writeback.sql": "f12514543f38ccd0977e3c9162f52026490dbbd8",
    "supabase/migrations/20260929134340_health_truth_optional_sources_nonblocking.sql": "e04c5597ac24ba48014d95aa1c47687b2e92e5f4",
    "supabase/migrations/20260929134439_use_provider_neutral_external_intelligence_health.sql": "86df6546c0ef63481554a72cad9ac6c3623a3719",
    "supabase/migrations/20260929134548_warnings_nonblocking_and_retire_legacy_external_signals_health.sql": "8674c7bc64da7a1f0e1593bcac3c3e141d943a6c",
    "supabase/migrations/20260929141537_powerhouse_one_million_revenue_operating_contract_v1.sql": "0a52106e65eac8a93ec5f3df94091ad6a371fae4",
    "supabase/migrations/20260929142230_powerhouse_one_million_revenue_operating_contract_v1.sql": "0c6e5c547f8433fb3a16a26b2cb58d61167e3ec1",
    "supabase/migrations/20260929142718_powerhouse_email_reply_learning_loop_v1.sql": "ff2e5d50b48e766a700001d7912dc93ed642c0a8",
    "supabase/migrations/20260929142832_linkedin_sales_bounded_prep_v1.sql": "f11c4728dd5c119f709bf9352fe47e04ab6d8b5b",
    "supabase/migrations/20260929143015_powerhouse_email_reply_learning_refresh_v1.sql": "e9ffddf22a69d6e7637baf6ab1bbeb8af3367830",
    "supabase/migrations/20260929143018_linkedin_sales_prep_supporting_indexes_v1.sql": "ca8a078ad9b11beffceae3b9a916e2de749b8fd8",
    "supabase/migrations/20260929143336_schedule_powerhouse_email_reply_loop_v1.sql": "fa553aa4bb71c8bd9c19adb0f46329000325ddde",
    "supabase/migrations/20260929145201_growth_swarm_bounded_refresh_v1.sql": "f047bb08723eea926a07a30e6c1b19735d0137b3",
    "supabase/migrations/20260929145830_powerhouse_email_suppression_hard_guard_v1.sql": "6651d8ff28731dea0a8d5f3728b62fe55f320a3d",
    "supabase/migrations/20260929150415_relationship_revenue_bounded_refresh_v1.sql": "43ec6e009c56abdfddfd2ff6bd1a29397f91ec01",
    "supabase/migrations/20260929152922_instagram_canonical_mira_identity_guard_v1.sql": "257863756f3014551f0e2e07cde087e1eb4599cc",
    "supabase/migrations/20260929183956_powerhouse_mira_public_complaint_source_loop_v1.sql": "113b3cd976d74bcccd748e8bb2ef0c3f48c84509",
    "supabase/migrations/20260929184112_mira_human_problem_source_loop_v1.sql": "c68c705f1dd631775388116bb8fd91ff44fec303",
    "supabase/migrations/20260929184429_mira_problem_loop_canonicalize_end_to_end_v1.sql": "2bccf5cb87f7fa97f33d8db462172880c7131cc9",
    "supabase/migrations/20260929184650_powerhouse_mira_public_problem_source_contract_v3.sql": "33887d7c7c5680f5ca201d05c6a05c689b14ca2d",
    "supabase/migrations/20260929185313_powerhouse_source_backed_all_channels_lineage_v1.sql": "533d358fc2e492a0dda8ec038be0cc260d4583d8",
    "supabase/migrations/20260929185643_powerhouse_source_backed_channel_selection_v1.sql": "ae595fa3e5b4b0bb74f7f4257df20aa7db08630b",
    "supabase/migrations/20260929185944_powerhouse_direct_outreach_source_gate_status_fix_v1.sql": "623b847015b4dec1a1ec77ae6ab5058bfa1ee282",
    "supabase/migrations/20260929190328_powerhouse_loop_assurance_v2.sql": "6039fb98baf8c79c004e93b72d5b374fc3039598",
    "supabase/migrations/20260929191156_powerhouse_loop_assurance_receipt_bridge_v3.sql": "321500cc4b3e9cfe585a9a59755a04d2294a545c",
    "supabase/migrations/20260929191227_powerhouse_loop_assurance_receipt_bridge_v3_fix.sql": "6588288a0e68f723e1eac873df4f2b741cad3787",
    "supabase/migrations/20260929191307_powerhouse_loop_assurance_obligation_identity_fix_v3.sql": "c7655e8f702e99da501400c917a57e8cd3c6f617",
    "supabase/migrations/20260929191618_powerhouse_loop_assurance_v3_security_hardening.sql": "d1f70417611550d89ca2d2b5ee43c3f456cbe3a0",
    "supabase/migrations/20260929192523_powerhouse_source_backed_outbound_loop_assurance_v1.sql": "80c21cfc812e2a692fe8ba0caa3a7b2184432116",
    "supabase/migrations/20260929192529_powerhouse_source_backed_outbound_loop_assurance_v1.sql": "80c21cfc812e2a692fe8ba0caa3a7b2184432116",
    "supabase/migrations/20260929192550_powerhouse_source_backed_outbound_loop_assurance_v1.sql": "80c21cfc812e2a692fe8ba0caa3a7b2184432116",
    "supabase/migrations/20260929192739_powerhouse_source_backed_blog_semantic_coherence_v1.sql": "ab727efc0a56c4b2083128d6d7592aa52b81c3ce",
    "supabase/migrations/20260929192803_powerhouse_source_backed_blog_semantic_coherence_v1.sql": "ab727efc0a56c4b2083128d6d7592aa52b81c3ce",
    "supabase/migrations/20260929193045_powerhouse_autonomous_outreach_loop_assurance_v1.sql": "1d05824cf2de3ef83b764103946fafb00298b5de",
    "supabase/migrations/20260930051015_enforce_story_family_duplicate_guard_v2.sql": "d7557702fd3237d07ba933905c7cba6f2176d5ce",
    "supabase/migrations/20260930051107_harden_global_post_uniqueness_overlap_v3.sql": "1717ab3b4f05e780a1c2fe39196156ae39b78380",
    "supabase/migrations/20260930061259_powerhouse_story_family_overlap_guard_v6_security_closure.sql": "a64837db5b4fc4f0baab1ba7bc5cebd00d3981b1",
    "supabase/migrations/20260930113737_powerhouse_bilingual_seo_revenue_v1.sql": "f038aaf9f6b333679adda225401efc1ccd3da452",
    "supabase/migrations/20261001093824_linkedin_webhook_event_fields.sql": "a8e50eb984ed59e37ff9a44d5c56359bab2bd1de",
    "supabase/migrations/20261001101003_add_linkedin_company_platform_publisher_trigger.sql": "dec4da3a3b2dd0e248e3db5c7d01642fe3d329d9",
    "supabase/migrations/20261001103950_linkedin_leadmagnet_100_webhook_router.sql": "5837ffb0a0d7e57cb5144ce1ce3e24a1a2ff3944",
    "supabase/migrations/20261001122400_improve_powerhouse_outreach_specificity_v2.sql": "10c32f82a22c31baf2861a9879659d8c47fc9ac5",
    "supabase/migrations/20261001122503_make_autonomous_outreach_specific_at_creation_v2.sql": "44f0ea32387ff556214d69e0d2791c9ffb663ac6",
    "supabase/migrations/20261001123911_unified_outbound_copy_reply_learning_v1.sql": "fd50de31655fc8278b283f71570aa5cfa548b509",
    "supabase/migrations/20261001124049_unified_outbound_copy_reply_learning_v2.sql": "269050fb44f039ebdf7312baae458e134ca89472",
    "supabase/migrations/20261001124228_unified_outbound_copy_reply_learning_v3.sql": "2c37fe486f5666b10a659a9eb2792637a0600998",
    "supabase/migrations/20261002054509_powerhouse_retired_story_family_negative_evidence_v7.sql": "080028759a0f18d366ca1883214ca28f271fad5d",
    "supabase/migrations/20261002100754_powerhouse_email_reply_followup_trigger_v1.sql": "1e488bd60965b42400e3ea53f53ffaa46b03efd7",
    "supabase/migrations/20261002141746_fix_cycle_signal_replay_idempotency.sql": "bc8743fd68578f7a84a287ae3d5cf5ab0512f15d",
    "supabase/migrations/20261002142307_loop_assurance_guard_truth_gate.sql": "75c47b1d0257beddcc69cb400938355102637da6",
    "supabase/migrations/20261002142500_add_regression_stage_evidence_bridge.sql": "682c966dfcb75244dae2c7d38fbd05739fb06ae3",
    "supabase/migrations/20261002142652_fix_seo_assurance_output_basis.sql": "8d7f85a4fc89354688c1e13645f4f802558df9f1",
    "supabase/migrations/20261002152823_linkedin_org_reauth_request_wrapper.sql": "d5368eb20e87db6d9a9b8fd858b7128f89d76eae",
    "supabase/migrations/20261003072503_signal_taxonomy_self_heal_v1.sql": "1b819d86b080f427652c366de62d2bd501c4ba9f",
    "supabase/migrations/20261003072536_signal_taxonomy_self_heal_promotion_v2.sql": "43056286b7fbb9594aaeee8d4e33ddb92ade0690",
    "supabase/migrations/20261003075431_publication_proof_accept_verified_provider_terminal.sql": "1527d1605575d9c4d43135d9dba0a73b63716a75",
    "supabase/migrations/20261003083859_exclude_derived_loop_assurance_from_one_brain_runtime_errors.sql": "c25d6e9162fa303997a223d80df5f4cfac875648",
    "supabase/migrations/20261003084014_linkedin_personal_no_gap_observational_v1.sql": "e7812c12e84d124968ff496ef88c25cf3eebac49",
    "supabase/migrations/20261003151427_linkedin_personal_obligation_dual_truth_gate_v1.sql": "f5106ece29dfdc89720d2c292f0ca8ae53aca786",
    "supabase/migrations/20261003151956_linkedin_personal_artifact_dual_truth_gate_v1.sql": "08cffc6eb9d1725f3a0b54c462c0212e221b8b50",
    "supabase/migrations/20261004095531_powerhouse_email_execution_watchdog_v1.sql": "0d3db932f3126dbfce13c52b6b1482fc8b776100",
    "supabase/migrations/20261004100422_structural_email_provider_preflight_and_assurance.sql": "7daea3ff7392bc387182d9e93dab31e2a836bc07",
    "supabase/migrations/20261004114640_linkedin_company_growth_engine_v1.sql": "068bf7a4fc58aa0e7b668091143a68b8105ea0fb",
    "supabase/migrations/20261004125007_salesrobot_capability_routing_v1.sql": "24b825b707457190de8c13a09fdc3b67607179ec",
    "supabase/migrations/20261004125303_salesrobot_capability_routing_v1_security_hardening.sql": "36762571a3f7c2a491697f05cc84324caa644dce",
    "supabase/migrations/20261004125402_salesrobot_capability_resolver_invoker_security.sql": "fdfee2f2507a73e732605f14b70ee6fa4048e4c6",
    "supabase/migrations/20261005071257_commercial_action_closure_v2.sql": "5f672d8e0240eac5b33d2c803603f1327d6bb3e5",
    "supabase/migrations/20261005071612_commercial_output_assurance_v1_lightweight.sql": "664121cf560da4f15a563cb44753417c0a57ea88",
    "supabase/migrations/20261005120215_one_brain_single_learning_owner_v1.sql": "f8620c4b355bc6be1ee7fe92d120c2deb889691a",
    "supabase/migrations/20261005120431_relationship_identity_expression_indexes_v1.sql": "d2bdce46d725f48848316505f634999f60675187",
    "supabase/migrations/20261005120706_one_brain_runtime_authority_gate_v1.sql": "70d06a7ba87c458e845254c16a463b3a5d5a75f0",
    "supabase/migrations/20261005123127_bounded_commercial_intelligence_heartbeat_v1.sql": "4b60416b46db5a17fcc1656f637f5ede5263e4fa",
    "supabase/migrations/20261005123347_bounded_commercial_intelligence_stages_v2.sql": "c4dd44b910f59634a0489f5d37f64313cedf4d99",
    "supabase/migrations/20261005133952_powerhouse_one_commercial_closed_loop_v1.sql": "902e5cbf9b8f23f8f95a52a2a7c301044297d436",
    "supabase/migrations/20261005134327_powerhouse_bounded_commercial_enrichment_v1.sql": "4ff17be5e4aeb98ecd3a4bd2b9bc988cc53f5b86",
    "supabase/migrations/20261005134654_powerhouse_one_commercial_decision_loop_v1.sql": "ba889f0782e8e8def803cb56d89d998eac8d37e2",
    "supabase/migrations/20261005134658_powerhouse_commercial_read_model_runtime_v1.sql": "7d0e86c6bbcddf009036167c2ee4160de14d6885",
    "supabase/migrations/20261005134824_powerhouse_one_commercial_scheduler_owner_v1.sql": "78157def68166632dee59e5c27e0c114e166a696",
    "supabase/migrations/20261005135004_powerhouse_revenue_snapshot_nba_v5_pending_response_v1.sql": "101441f5aac3a78ee0f61ca18087b2e13f60e50a",
    "supabase/migrations/20261005135606_powerhouse_single_commercial_candidate_owner_v1.sql": "37c2eef3efc065c876638c33c8cee5aac1126601",
    "supabase/migrations/20261005135738_powerhouse_materializer_source_url_not_null_fix_v1.sql": "3ccc836490882777e72549cc93f9d455cb645b8d",
    "supabase/migrations/20261005135921_powerhouse_materializer_source_url_not_null_fix_v2.sql": "182ef4a527d5ec304f771d5ea799cdd20984f9e3",
    "supabase/migrations/20261005135948_powerhouse_one_commercial_heartbeat_terminal_lineage_v1_retry.sql": "a16905fd912732b47e4c72dbd3f4e589c13d7f56",
    "supabase/migrations/20261005140225_powerhouse_bounded_identity_spine_v1.sql": "6d717cafbefbcdb7a2ee13b3a12f2ad7d408a0be",
    "supabase/migrations/20261005140306_powerhouse_deadlock_free_critical_path_and_provider_outcomes_v2.sql": "a2fc12996c0f1819912005727640fcd84aec8586",
    "supabase/migrations/20261005140426_powerhouse_forecast_topic_key_fix_v1.sql": "304f8df699d425f509013ef68c574c33ac4b7e41",
    "supabase/migrations/20261005140505_powerhouse_provider_lineage_scope_v1.sql": "2ac3e2cff454b852541becffe63fc1a2b08de66d",
    "supabase/migrations/20261005140527_powerhouse_one_loop_terminal_lineage_v1.sql": "6e5938490595ea9431d3ad9d521d22246261f0ad",
    "supabase/migrations/20261005140633_powerhouse_fresh_research_promotion_v1.sql": "32873081d5084dc3e5209a1d9934d2d3cd5b3ded",
    "supabase/migrations/20261005140648_powerhouse_provider_fresh_social_scope_v1.sql": "2f0b8cc7d07ab5e9652fddd7bf920ada66030582",
    "supabase/migrations/20261005141025_powerhouse_canonical_social_composer_fallback_v1.sql": "cd7e64c02b153a366fb2761f4ab32e1b4912cb14",
    "supabase/migrations/20261005141046_powerhouse_closed_loop_comment_composer_route_v1.sql": "3bbd42d16836160ae412823f88efb519148dcf06",
    "supabase/migrations/20261005141131_powerhouse_social_daily_pressure_cap_v1.sql": "0913a4ba6471cf83ade03ea2977b07c75ff390ea",
    "supabase/migrations/20261005141555_powerhouse_verified_linkedin_post_context_gate_v1.sql": "50e475c60ddcb18ba870f68f8067bfb622170ac2",
    "supabase/migrations/20261005142034_powerhouse_exact_message_hash_and_linkedin_dedupe_v1.sql": "5e3854283a7189562b10727b2c311a1b4a7a3305",
    "supabase/migrations/20261005142118_powerhouse_social_exact_hash_two_phase_v2.sql": "9cc840e7bda664a23fabce57b4b0a29f6bea0a4e",
}


def historical_mirror_is_exact(path: Path) -> bool:
    expected = HISTORICAL_PRODUCTION_MIRROR_BLOBS.get(path.as_posix())
    if not expected or not path.exists():
        return False
    actual = subprocess.run(["git", "hash-object", str(path)], check=True, capture_output=True, text=True).stdout.strip()
    return actual == expected


def check_sql(sql: str, label: str):
    errors = []
    low = sql.lower()

    for table in CREATE_TABLE.findall(sql):
        rls_pat = re.compile(rf"alter\s+table\s+(?:if\s+exists\s+)?public\.{re.escape(table)}\s+enable\s+row\s+level\s+security", re.I)
        revoke_pat = re.compile(rf"revoke\s+all\s+on\s+(?:table\s+)?public\.{re.escape(table)}\s+from\s+[^;]*(?:anon[^;]*authenticated|authenticated[^;]*anon)", re.I | re.S)
        if not rls_pat.search(sql):
            errors.append(f"{label}: public.{table} is created without ENABLE ROW LEVEL SECURITY in the same migration")
        if not revoke_pat.search(sql):
            errors.append(f"{label}: public.{table} is created without revoking broad anon/authenticated table privileges in the same migration")

    for view in CREATE_VIEW.findall(sql):
        intentional = (
            f"POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL_VIEW:{view}" in sql
            or "POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL_VIEW" in sql
        )
        alter_invoker_pat = re.compile(rf"alter\s+view\s+public\.{re.escape(view)}\s+set\s*\(\s*security_invoker\s*=\s*true\s*\)", re.I)
        inline_invoker_pat = re.compile(rf"create\s+(?:or\s+replace\s+)?view\s+public\.{re.escape(view)}\s+with\s*\(\s*security_invoker\s*=\s*true\s*\)", re.I)
        revoke_pat = re.compile(rf"revoke\s+all\s+on\s+(?:table\s+)?public\.{re.escape(view)}\s+from\s+[^;]*(?:public[^;]*anon[^;]*authenticated|public[^;]*authenticated[^;]*anon|anon[^;]*authenticated|authenticated[^;]*anon)", re.I | re.S)
        if not intentional:
            if not (alter_invoker_pat.search(sql) or inline_invoker_pat.search(sql)):
                errors.append(f"{label}: public.{view} is created without security_invoker=true in the same migration")
            if not revoke_pat.search(sql):
                errors.append(f"{label}: public.{view} is created without revoking browser-role view privileges in the same migration")

    if SECURITY_DEFINER.search(sql):
        intentional = "POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL" in sql
        revoke_exec = "revoke execute on function" in low and "from public" in low and "anon" in low and "authenticated" in low
        if not intentional and not revoke_exec:
            errors.append(f"{label}: SECURITY DEFINER introduced without fail-closed EXECUTE revocation or explicit POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL marker")

    for fn in CREATE_FUNCTION.findall(sql):
        fn_mentioned = re.search(rf"alter\s+function\s+public\.{re.escape(fn)}\s*\([^;]*\)\s+set\s+search_path", sql, re.I | re.S)
        body_has_set = re.search(r"set\s+search_path\s+(?:to|=)", sql, re.I)
        if not fn_mentioned and not body_has_set:
            errors.append(f"{label}: public.{fn} is created/replaced without deterministic search_path")
    return errors


def self_test():
    unsafe_table = "create table public.bad_table(id bigint);"
    unsafe_view = "create view public.bad_view as select 1 as id;"
    unsafe_fn = "create function public.bad_fn() returns void language plpgsql security definer as $$ begin null; end $$;"
    safe_table = "create table public.good_table(id bigint); alter table public.good_table enable row level security; revoke all on table public.good_table from anon, authenticated; grant all on table public.good_table to service_role;"
    safe_view = "create view public.good_view as select 1 as id; alter view public.good_view set (security_invoker = true); revoke all on table public.good_view from public, anon, authenticated; grant select on table public.good_view to service_role;"
    safe_inline_view = "create or replace view public.good_inline_view with (security_invoker = true) as select 1 as id; revoke all on public.good_inline_view from public, anon, authenticated; grant select on public.good_inline_view to service_role;"
    public_view_exception = "-- POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL_VIEW:public_view\ncreate view public.public_view as select 1 as id;"
    safe_fn = "create function public.good_fn() returns void language plpgsql security definer set search_path = public, pg_catalog as $$ begin null; end $$; revoke execute on function public.good_fn() from public, anon, authenticated; grant execute on function public.good_fn() to service_role;"
    public_exception = "-- POWERHOUSE_SECURITY_EXCEPTION: PUBLIC_INTENTIONAL\ncreate function public.public_fn() returns void language plpgsql security definer set search_path = public, pg_catalog as $$ begin null; end $$;"
    assert len(check_sql(unsafe_table, "unsafe_table")) == 2
    unsafe_view_errors = check_sql(unsafe_view, "unsafe_view")
    assert any("security_invoker" in e for e in unsafe_view_errors)
    assert any("view privileges" in e for e in unsafe_view_errors)
    unsafe_fn_errors = check_sql(unsafe_fn, "unsafe_fn")
    assert any("SECURITY DEFINER" in e for e in unsafe_fn_errors)
    assert any("search_path" in e for e in unsafe_fn_errors)
    assert check_sql(safe_table, "safe_table") == []
    assert check_sql(safe_view, "safe_view") == []
    assert check_sql(safe_inline_view, "safe_inline_view") == []
    assert check_sql(public_view_exception, "public_view_exception") == []
    assert check_sql(safe_fn, "safe_fn") == []
    assert check_sql(public_exception, "public_exception") == []
    print("Powerhouse Supabase security contract self-test passed: unsafe tables/views/functions blocked, safe fixtures accepted.")


if "--self-test" in sys.argv:
    self_test()
    sys.exit(0)

BASE = sys.argv[1] if len(sys.argv) > 1 else "origin/main"
HEAD = sys.argv[2] if len(sys.argv) > 2 else "HEAD"
result = subprocess.run(["git", "diff", "--name-only", f"{BASE}...{HEAD}", "--", "supabase/migrations/*.sql"], check=True, capture_output=True, text=True)
files = [Path(p) for p in result.stdout.splitlines() if p.strip()]
if not files:
    print("No changed Supabase migrations; security contract passes.")
    sys.exit(0)

errors = []
mirrors = []
for path in files:
    if not path.exists():
        continue
    if historical_mirror_is_exact(path):
        mirrors.append(path.as_posix())
        continue
    errors.extend(check_sql(path.read_text(encoding="utf-8"), str(path)))

if errors:
    print("Powerhouse Supabase security contract FAILED:\n")
    for error in errors:
        print(f"- {error}")
    print("\nRequired contract: RLS + revoked browser roles for new public tables; security_invoker + revoked browser roles for new internal public views; deterministic search_path for functions; SECURITY DEFINER must be internal/revoked or explicitly reviewed as PUBLIC_INTENTIONAL. Historical production mirrors are exempt only at an exact reviewed Git blob SHA.")
    sys.exit(1)

if mirrors:
    print("Verified immutable historical production mirrors: " + ", ".join(mirrors))
print(f"Powerhouse Supabase security contract passed for {len(files)} changed migration(s).")