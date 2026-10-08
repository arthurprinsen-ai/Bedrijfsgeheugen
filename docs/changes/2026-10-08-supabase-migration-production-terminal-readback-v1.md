# Supabase-only production terminal readback

A Supabase SQL-only PR is not a Netlify website release. The canonical Obligation Terminal Closure now checks the **production Supabase migration ledger** through the authenticated Management API using the existing `SUPABASE_ACCESS_TOKEN` GitHub secret, rather than waiting for an unrelated `release.json` SHA.

The readback selects the exact fourteen-digit versions of the migration files in the merged PR and requires every version to be present in the production ledger. Missing credentials, non-200 provider response, unexpected data, partial versions and a missing migration all fail closed. No write query or schema mutation is performed. The secret is never logged. Netlify/portal changes and mixed delivery still follow the existing production deploy checks; Edge Functions continue to require exact provider runtime evidence.

Original failure: Obligation Terminal Closure #37762343546, PR #4128. The SQL migration was already applied to production, and the natural Heartbeat recorded two verified publications. No forced GitHub merge or bypass of protected checks.
