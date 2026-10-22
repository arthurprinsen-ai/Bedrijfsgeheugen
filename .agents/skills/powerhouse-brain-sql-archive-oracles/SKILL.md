---
name: powerhouse-brain-sql-archive-oracles
description: Source-contract recovery for BRAIN tests reading retired Supabase migration SQL, preserving security and release requirements.
---

# Recover inherited historical SQL oracle failures

1. Compare exact-head failing test identity against `main`; separate historical ENOENT from substantive assertion failure.
2. For historical source tests, prove nonempty original SQL at `supabase/migration-history/repository-only` on the exact baseline; refuse missing or mismatched archives.
3. Update only the corresponding read-only test source path, retaining every original assertion. Do not make an archived migration executable, create placeholder SQL, mask failures or weaken AGENTS.md, RLS, ACL, CI, CodeQL or BRAIN.
4. Add a guard for canonical historical source and absent executable duplicate. Rerun targeted tests plus full exact-head protected BRAIN (zero failures), Required CI and CodeQL.
5. Preserve one writer per obligation, protected merge and production readback. Record commit/outcome in Brain learning and append-only development ledger; never label candidate as live.
