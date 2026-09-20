# Production migration identity is part of release truth

Supabase migration execution and Git repository state must describe the same migration identity, not merely equivalent SQL. The Instagram/social-authority release reached production code, but terminal closure correctly refused to claim completion while the production migration ledger did not contain the repository identities.

The migrations have now been executed through the Supabase migration API and their exact production versions are authoritative. The repository is reconciled to those versions without changing migration contents.

This keeps replay, audit, recovery and terminal evidence deterministic. A future migration mismatch must remain a hard blocker rather than being waived or recorded as green.
