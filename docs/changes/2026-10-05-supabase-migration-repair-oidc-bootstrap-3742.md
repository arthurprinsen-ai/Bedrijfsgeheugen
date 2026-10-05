# #3742 OIDC repair bootstrap

The credential topology is split from Supabase source canonicalization to remove a bootstrap cycle.

The production bridge `supabase-migration-repair-bridge` is already ACTIVE and validates GitHub OIDC claims for the exact repository, `refs/heads/main`, exact repair workflow and exact SHA. This change only updates trusted GitHub workflow code to acquire that transport and run the official Supabase CLI with `--db-url`.

No `supabase/**` source path is changed by this bootstrap PR. Therefore hosted Supabase Preview is correctly not applicable here; requiring it would make the repair transport depend on the historical replay failure the repair is intended to resolve.

After the trusted repair succeeds and #3766 proves fresh replay, the bridge source/config can be canonicalized in-repository under the normal Supabase Preview gate.

## Supabase CLI list parser correction

The trusted repair reached the IPv4-compatible Supavisor session pooler successfully. The next failure was local parsing, not provider connectivity: `supabase migration list` renders migration versions with Markdown-style backticks. The workflow previously validated each cell against `^\d{14}$` before removing those presentation characters, so every migration row was discarded and the pre-repair drift was incorrectly observed as an empty set.

The parser now strips backticks before validating versions, both before and after repair. The four-version allowlist remains exact and any unexpected local/remote drift still fails closed.
