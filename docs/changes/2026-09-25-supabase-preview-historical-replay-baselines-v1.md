# Supabase preview historical replay baselines

A clean hosted Supabase preview exposed two migration-history assumptions that incremental production had hidden:

1. `20260920101200_terminal_health_lifecycle_v2` expected a historical P0 desired-state row that was never captured in migrations.
2. `20260920102500_publication_authority_pgcrypto_qualification` referenced the Instagram daily-winner rowtype before `20260920110000_instagram_daily_winner_lineage_v1` created the table.

The recovery adds evidence-derived, idempotent baselines before first use. Existing production state/schema remains unchanged; unknown drift fails closed.

3. The production fallback function depended on `powerhouse_instagram_media_reserve_v1`, a secured table that existed in production but nowhere in migration history.

The recovery now also captures that exact production table shape before the fallback function is created.
