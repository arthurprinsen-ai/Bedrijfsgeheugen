# BRAIN commercial historical SQL pointers — 22 October 2026

Obligation: ci-brain-archived-commercial-oracle-batch-20261022; parent #3742; related #4215. Ten original contract suites now read 11 immutable repository-only SQL files instead of retired executable migration paths. Existing assertions remain intact. A new regression asserts exact Git source blobs, nonempty source, absent executable duplicates and test pointers.

- `tests/brain-human-commercial-orchestrator-v1.test.mjs`: 20261005135000_powerhouse_human_commercial_orchestrator_v1.sql
- `tests/brain-powerhouse-all-20-growth-plays-v3.test.mjs`: 20260928161000_powerhouse_all_20_growth_plays_v3.sql
- `tests/brain-powerhouse-growth-plays-20of20-v1.test.mjs`: 20260928162600_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql
- `tests/brain-powerhouse-growth-swarm-v1.test.mjs`: 20260928123500_powerhouse_growth_swarm_v1.sql, 20260928124000_powerhouse_growth_swarm_activation_v1.sql
- `tests/brain-powerhouse-loop-assurance-v3.test.mjs`: 20260929212500_powerhouse_loop_assurance_v3.sql
- `tests/supabase-action-evidence-obligations-v1.test.mjs`: 20260918103100_action_evidence_obligations_v1.sql
- `tests/supabase-powerhouse-dataforseo-intelligence-v1.test.mjs`: 20260918100000_powerhouse_dataforseo_intelligence_schedule_v1.sql
- `tests/supabase-powerhouse-full-cycle-status-normalization.test.mjs`: 20260915140200_powerhouse_full_cycle_status_normalization_v1.sql, 20260915140300_powerhouse_forecast_calibrator_timing_gap_fix_v1.sql
- `tests/supabase-powerhouse-growth-swarm-v1.test.mjs`: 20260928123500_powerhouse_growth_swarm_v1.sql, 20260928124000_powerhouse_growth_swarm_activation_v1.sql
- `tests/supabase-tenant-identity-hardening-contract.test.mjs`: 20260915170000_powerhouse_tenant_identity_hardening_v1.sql

No production/migrations/runtime/RLS/authorization/provider/scheduler data changed. Full BRAIN zero failures, exact-head Required + CodeQL and #3742/#4215 acceptance remain required and unproven.
