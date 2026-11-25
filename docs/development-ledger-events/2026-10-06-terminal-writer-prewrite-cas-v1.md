# Development ledger event — terminal writer pre-write CAS v1

- Date: 2026-10-06
- Obligation: `terminal-writer-prewrite-cas-20261006-v1`
- Lane: automation
- Candidate type: implementation
- Escaped defect: stale writer snapshots could mutate an open terminal candidate before current-main admission rejected them.
- Decision: terminal candidate branches are content-immutable; pre-terminal writes require head-SHA + main-epoch CAS.
- Drift action: create one successor from current `main`; never replay an old snapshot onto the predecessor.
- Preserved authorities: protected merge, exact-head checks, Supabase provider/readback gates, terminal production evidence.
