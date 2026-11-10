# 2026-11-10 — Original commercial 823rd provider migration identity recovery

Original P0 owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

The immediately preceding original PR #5583 merged the production source `20261110134500_original_source_wait_is_not_send_v1.sql` into main. On 2026-11-10 13:17:39 UTC independent Supabase migration readback contained **823** exact applied version/name pairs and an independently queried `supabase_migrations.schema_migrations` row with exact `20261110134500` / `original_source_wait_is_not_send_v1`. The immutable original `supabase/migration-history.lock.json` contained 822; every previous entry matched actual Supabase. Strict protected migration integrity checks correctly fail when an additional provider-applied source version is absent from the lock.

This recovery appends **only** the actual provider-applied 823rd version/name to the original immutable snapshot, records exact observed time, and advances the original historical parity regression with both 20261110131500 Gmail and 20261110134500 source-WAIT. No SQL execution, no new migration, no producer/scheduler, no invented sent outcome and no weakening or bypass of protected test/preview.

Permanent prevention: original source migration GitOps must deliver an exact post-apply provider migration-history handoff to the original source owner; eliminate repeated gaps between protected merge → provider apply → lock readback. One original commercial execution and ONE BRAIN remain authorities. Separate portal runtime PR #5581 stays unmerged until exact protected CI, safe latest-main integration and Netlify readback.

Last hard gates: protected Required/CodeQL, 823/823 provider-source parity, the original provider function and exact signed-in Portal A/B and downstream result evidence. Source lock correctness does not prove commercial delivery or full business loop.
