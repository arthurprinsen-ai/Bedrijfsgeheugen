# Supabase production baseline proof

Issue #3742 must remain fail-closed unless repository state can be reconstructed from scratch and compared with an official production baseline.

The production baseline is now obtained only through the pinned Supabase CLI using `supabase db dump --linked`. Migration history parity is obtained with `supabase migration list --linked`. No schema is synthesized from `pg_catalog` or `information_schema`.

The workflow executes only from trusted `main`. Production credentials are scoped to the two provider-read steps. Candidate code is checked out separately and receives no production credentials. Migration-list input is further reduced to trusted `config.toml` plus the candidate migration directory, so arbitrary candidate code is never executed in a credential-bearing step.

The candidate is reconstructed from scratch with `supabase db start`, `supabase db reset --local`, and `supabase db dump --local`. The official production dump and replay dump are normalized only for pg_dump comments, psql restrict markers and insignificant trailing whitespace, then SHA-256 compared. Any schema mismatch or local/remote migration-list mismatch fails closed.

This proof is intentionally pre-terminal. Passing it does not close #3742. Terminal closure still requires the exact candidate HEAD checks, protected merge and post-merge production/readback.
