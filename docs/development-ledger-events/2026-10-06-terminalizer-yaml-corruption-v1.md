# 2026-10-06 — terminalizer YAML corruption recovery

- Trigger: merge of PR #3821.
- Main merge SHA: `3804307006a0e716413b319cac6a340beceac92f`.
- Failed Actions run: `37429302807`, zero jobs.
- Root cause: unsafe multiline replacement across a shell continuation corrupted and duplicated the terminalizer workflow body.
- Recovery: restore last valid workflow blob `81f5404e4e20900b6f9a5297d4ef94c6246e7155`; reapply only intended classifier/allowlist edits; add singularity regression.
- No Supabase schema or migration-history mutation is performed by this recovery.
