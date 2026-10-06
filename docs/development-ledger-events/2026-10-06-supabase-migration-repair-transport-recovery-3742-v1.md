# Development ledger — Supabase repair transport recovery #3742

- Trusted-main source run: 37425004020.
- Observed failure: Supavisor session connection terminated before initial migration-list readback.
- Provider evidence: SQLSTATE 08006 / broken-pipe client loss; project status remained ACTIVE_HEALTHY.
- Decision: stop blind identical workflow retries after two failures.
- Correction: bounded retries for read-only migration-list acquisition only.
- Safety invariant: supported repair mutation remains single-shot, exact four-version allowlist unchanged, no direct writes to `supabase_migrations`, zero-drift final readback mandatory.
