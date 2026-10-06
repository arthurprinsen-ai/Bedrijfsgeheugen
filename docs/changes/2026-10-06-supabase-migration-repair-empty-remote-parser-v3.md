# Supabase repair empty-remote parser v3

Trusted repair run 37425004020 reached the production migration list successfully. Supabase CLI renders an absent remote version as \` \`. The prior parser trimmed before removing backticks, so stripping the backticks left whitespace and incorrectly triggered `REMOTE_ONLY_OR_IDENTITY_DRIFT`.

This change normalizes both pre- and post-repair cells as: trim, remove surrounding presentation backticks, trim again. It does not change the four-version allowlist, OIDC transport, supported `supabase migration repair --status applied` command, or any production DDL/DML semantics.
