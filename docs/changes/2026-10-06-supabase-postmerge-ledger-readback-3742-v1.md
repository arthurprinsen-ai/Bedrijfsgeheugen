# Trusted post-merge Supabase migration-ledger readback

The #3742 recovery already has a successful supported provider repair run (`37426469433`) and zero drift immediately after repair. Protected PR #3766 subsequently merged as `ccdf134ca4de73e547e54c9de00298d771f87be5`.

The trusted OIDC repair workflow now recognizes that #3766 is merged and automatically enters readback-only mode. It verifies the repaired lock state, obtains database transport through the existing OIDC bridge, runs `supabase migration list --db-url`, requires zero drift, requires an exact 568-entry ledger, requires all four repaired replay-baseline versions on both local and remote sides, and uploads immutable evidence. The branch/PR mutation step is explicitly skipped in readback mode.
