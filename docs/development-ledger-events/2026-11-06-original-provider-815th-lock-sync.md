# 2026-11-06 — original production migration lock reconciliation

- Source of truth: original Supabase project adhjwmvyoixzjtmiroln and existing supabase/migration-history.lock.json.
- Evidence: 815 original applied version/name identities after protected PR #5497; first 814 equal old source lock, only provider-proven extra migration 20261106144500_weekly_cron_health_cadence_original_function_v1.
- Original defect: next protected Mira PR #5498 rightly found source-lock inconsistency; same-PR lock patch is forbidden for new migrations.
- Fix: lock-only PR updates recorded provider history, and this ledger plus learning plus human documentation accompany the atomic bounded change.
- Prevent recurrence: provider readback then independently protected source-lock sync, BEFORE proposing further migrations.
- Gates: exact-head Required, CodeQL, protected merge, original provider list_migrations and GitHub main readback.
- Status: CODE_CANDIDATE until proven, no new migration or production provider action.
