# 2026-11-15 — during-repair CI incident: original 870th provider migration absent from lock

- Parent incidents: #3742 (Supabase migration history), #4198 (commercial closure) and candidate PR #5884.
- Original protected CI failure: `INTEGRATION_BUNDLE` gate later `Enforce Supabase migration lock parity before merge`, test suite detected migration 20261115162500 present locally but not under exact original `supabase/migration-history.lock.json`.
- Source proof: native Supabase list_migrations reports 870 including exact pair `20261115162500/original_personal_source_supplier_completeness_v4`. Original 869 lock entries each have a matching provider record. Original SQL is already present in protected Git. Read 2026-11-15T16:04:24Z UTC.
- Root cause: source writer did not include an independently verified provider-applied migration in the canonical Git lock. This CI gate correctly fails, and blocks unrelated code. No need or authority to reapply already-run SQL.
- Safe repair: append exact provider version/name to original lock, keep existing 869 untouched, document independent evidence in same protected 4-file PR, rerun migration lock regression and CodeQL. Remain unapplied if provider proves different.
- Prevention: every actual migration author ensures SQL + provider application + readback lock in same original lineage; if provider later diverges, refuse merge and reconcile from native provider, never forge or disable gate.
- Separate business result: 3 original handoffs remain unproven; no closure claim until natural consumers and outcome evidence.
