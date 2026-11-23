# Native 869 migration source-lock reconciliation — original immutable authority

Date: 2026-11-15. Single existing P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
Original source PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5874.
Dependent original #175→#140 recovery: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5872.

## Provider and source evidence
The original protected PR #5874 added executable migration `20261115162000_personal_observation_source_no_resurrection_v1.sql` to GitHub main; independent native EU Supabase production `supabase_migrations.schema_migrations` at 2026-11-15 15:27:58.083020 UTC returned **869** applied migrations and exact version/name `20261115162000/personal_observation_source_no_resurrection_v1`. The canonical `supabase/migration-history.lock.json` still had **868** entries captured at 11:42:57 UTC, omitting this actually applied native record. Consequently the existing unrelated PR #5872 protected `preflight` failed native migration lock parity 868 != 869, including `supabase-migration-history-integrity`. This is not a reason to relax policy.

## Original source-lock repair
Append exactly ONE observed native version/name to the existing lock in GitHub via the protected review flow; preserve the original 868 entries byte-equivalent and order. Set `captured_at` to true native SQL readback time (not commit build time). No additional SQL, migration, new database, provider call, permission grant, scheduler or hidden dummy row. The original tests must verify exact inventory parity on every future migration and no invented app-specific provider effects.

## Protected acceptance
Required/CodeQL and exact current-main release merge, independent Git source lock vs native `schema_migrations` readback and existing downstream PR #5872 recheck. This only restores the source identity gate; original LinkedIn personal provider URN, #175→#140 source recovery, actual CRO execution, customer revenue and next natural learning are still separate source-bound OPEN obligations.
