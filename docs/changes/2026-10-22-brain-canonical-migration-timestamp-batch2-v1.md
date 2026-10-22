# Recover six BRAIN oracles without false SQL migrations

The full BRAIN log references planned migration timestamps no longer present after supported Supabase history reconciliation. The correct source SQL already exists in current executable migrations under reconciled timestamps. This repair changes only six test source path literals.

- `supabase/migrations/20261009190000_fix_noncommercial_conversion_projection_v1.sql` → `supabase/migrations/20261009155535_fix_noncommercial_conversion_projection_v1.sql` (actual SQL blob 96da76180829bd011b9c331b481ed07594c1c678).
- `supabase/migrations/20261009160500_salesrobot_provider_proof_daily_assurance_v1.sql` → `supabase/migrations/20261009141054_salesrobot_provider_proof_daily_assurance_v1.sql` (actual SQL blob 8a0f1020c5b07ea6a34165fc2a035c8161b6fc86).
- `supabase/migrations/20260928162600_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql` → `supabase/migrations/20260928140907_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql` (actual SQL blob 08df171c6d4b340c69fda68338e18020f0468422).
- `supabase/migrations/20260928152400_powerhouse_persuasion_revenue_optimizer_v1.sql` → `supabase/migrations/20260928133343_powerhouse_persuasion_revenue_optimizer_v1.sql` (actual SQL blob d38a9b83f34b3bab104289b28d38c73fdb573004).
- `supabase/migrations/20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql` → `supabase/migrations/20261012074151_20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql` (actual SQL blob 135a2a08eddfed78aa1e888e8f697ec9edbee34d).
- `supabase/migrations/20260929201000_powerhouse_mira_public_complaint_source_loop_v1.sql` → `supabase/migrations/20260929183956_powerhouse_mira_public_complaint_source_loop_v1.sql` (actual SQL blob 113b3cd976d74bcccd748e8bb2ef0c3f48c84509).

Guard `tests/brain-canonical-migration-timestamp-batch2-20261022.test.mjs` proves exact SQL blobs and byte-identical original assertions. No original Node tests skipped or assertions removed. This branch is not merged/production or full-suite accepted; partial source proof cannot satisfy 0-failure BRAIN, historical migration parity or A/B customer readback.
