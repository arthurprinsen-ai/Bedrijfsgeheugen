# Supabase migration repair CLI parser recovery — #3742

Trusted-main repair run 37354534547 attempt 3 successfully passed the GitHub OIDC authorization, acquired the IPv4 Supavisor session database transport, and executed `supabase migration list --db-url`.

Supabase CLI 2.119.0 renders migration-version cells with surrounding backticks. The parser accepted only bare fourteen-digit values, so it discarded valid rows and failed closed with `UNEXPECTED_PRE_REPAIR_DRIFT:[]` before the repair command executed.

This recovery strips only surrounding backticks and whitespace before the existing exact comparison. The safety contract is unchanged: pre-repair drift must be exactly the four reviewed local-only replay versions, remote-only drift is forbidden, post-repair drift must be zero, and production tracking may change only through official `supabase migration repair --status applied --db-url`.
