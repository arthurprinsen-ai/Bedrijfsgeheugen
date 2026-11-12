# 836th native Supabase provider migration → original Git source-lock

12 November 2026, Parent P0 #4198; downstream original Portal/Trust #5678.

## Authoritative production state
Original protected PR #5685 merged into main `c3a570f3f5f3b52ac23d35ee39d1a448339f395a`. Independent production query of native `supabase_migrations.schema_migrations` shows 836 applied migrations, newest exact `20261112211600_original_seo_opportunity_source_registry_v1`. The matching executable nonempty SQL exists on protected main at `supabase/migrations/20261112211600_original_seo_opportunity_source_registry_v1.sql`. Git `supabase/migration-history.lock.json` was 835 and ended at `20261112211000`. This is a recurring native-provider→Git source consumer lag (833, 834, 835, now 836).

## Bounded original-owner recovery
Append only the exact native provider-applied 836th version/name to the existing lock, preserving all 835 preceding identities and SQL. No second scheduler, duplicate SQL replay, direct production write, auth/RLS relaxation, fake ACK or separate executor. Historical first-835-prefix regression permits only genuinely applied append-only future provider versions, while complete current-source parity remains enforced separately.

## Release/consumer proof
Exact-head Required + BRAIN + CodeQL, existing Supabase Preview policy, protected merge; then independent original Git main lock and native provider 836/836 identity readback. Downstream Trusted Advisor #5678 and canonical Portal/ONE BRAIN/Heartbeat must replay on latest main. All other open publication/commercial obligations remain open until original owner produces consumer PROCESSED and effect proof.
