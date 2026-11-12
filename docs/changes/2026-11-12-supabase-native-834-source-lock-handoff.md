# Original native Supabase #834 → source-lock handoff

Date: 2026-11-12. Parent P0: #4198, related #4215. Obligation: `supabase|migration-history|native-provider-834-lock-handoff|20261112-v1`.

## Independently observed state

GitHub PR #5677 merged on production main `5ea1ae7dbab400e2d3e835e7cbaab7dab5356a8c`; its executable SQL `20261112203000_original_seo_keyword_tenant_alignment_v1.sql` is a real guarded update to original daily source archive owner #175. Production Supabase native `supabase_migrations.schema_migrations` records exactly that version/name as applied, while tracked `supabase/migration-history.lock.json` still contained 833 entries ending at `20261112194500`. Original PR #5674 Required run #43285752866 rejected protected preflight: 834 executable migration files vs 833 original source-lock rows (six failed regression assertions). This is a delivery gap, not permission to bypass parity.

## Bounded recovery

Append exactly the observed #834 identity to the existing canonical source lock, preserving prior 833 rows byte-for-byte as parsed JSON identities and all SQL files unchanged. Preserve historical #833 prefix test instead of freezing the future migration count; add #834 native regression. No SQL replay, new cron, new provider, or manual production deploy. Single source/Brain/Heartbeat lineage and original CI/CD.

## Required acceptance

Exact-head Required, BRAIN and CodeQL; protected merge; compare original GitHub lock with all native Supabase versions/names and SQL source; recheck previously blocked Portal PR #5674, original Supabase Edge #5680 and Trusted Advisor #5678. The latter still require their own exact production and end-to-end consumer readback. This lock PR is not a commercial effect or SEO ranking claim.
