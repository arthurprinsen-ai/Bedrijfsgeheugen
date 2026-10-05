# Supabase migration repair CLI output parser — #3742

Trusted-main repair run 37354534547 attempt 2 successfully authenticated through GitHub OIDC and connected to production through the IPv4 Supavisor session pooler. The repair still stopped before mutation because Supabase CLI 2.119.0 renders migration-list cells in Markdown backticks while the fail-closed parser accepted only bare 14-digit values.

This change strips presentation-only leading/trailing backticks from every parsed table cell before applying the existing exact drift checks. It does not relax the four-version allowlist, remote-only rejection, post-repair zero-drift requirement, or official `supabase migration repair --status applied` semantics.

Observed provider row: `` `20260920101150` | ` ` | `2026-09-20 10:11:50` ``.

No production migration-history mutation occurred in the failed attempt.
