# Development ledger — original provider lock drift after security migration

- Date: 2026-11-02; original obligation: `original-native-supabase-provider-790-lock-and-brain-replay-20261102-v1`; same incident fingerprint `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029`.
- Trigger: BRAIN backend job 125327938062 in workflow 41460310537 rejected 5 tests on exact PR #5307 head `c550bf7e1862529963266869d9a7c0f429ab0980`. Terminal workflow 41460262803 rejected incomplete BRAIN; do not conceal.
- Provider readback: 791 unique applied version/name identities. Original lock: 790; first 790 exact matches; one new applied version `20261102141045_writer_control_fixed_search_path_v1`, already present as executable original Git SQL.
- Only source change: append that original provider row and update `captured_at`. No DDL, rollback, duplicate writer, replacement data, or modified historical SQL.
- Prevention: original ONE BRAIN GitOps owner must perform full triple-source provider-lock-executable-SQL reconciliation after every applied migration and gate on same canonical Brain regression tests. Never mark failed terminal flow green on the strength of Netlify and Required alone.
- Candidate only until protected exact-head Required, CodeQL, full BRAIN and provider production readback, then update the original private incident with actual outcome.
