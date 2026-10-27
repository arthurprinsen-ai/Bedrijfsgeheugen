# Supabase migration-history terminalizer readback routing

PR #3766 merged successfully, but the canonical terminalizer classified its non-runtime Supabase migration-history recovery as an unwired runtime change because the classifier only recognized `supabase-migration-history-parity-*` obligation IDs. The canonical recovery uses `supabase-migration-history-canonical-v6`.

The terminalizer now recognizes both obligation families and permits only the bounded Supabase migration/evidence paths used by this recovery (`supabase/migrations/`, immutable migration history, migration-history lock, production baseline, and approved verifier paths). Unrelated non-Netlify runtime changes remain fail-closed.
