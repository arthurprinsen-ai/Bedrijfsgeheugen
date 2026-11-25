# P0 #4198 — truthful daily Brain learning outcome coverage

Canonical fingerprint: `powerhouse|daily-compound-learning|outcome-coverage-denominator-mismatch|20261022-v1`.

## Actual production evidence
Read-only October 22 SQL found 7,632 total actions, of which 317 are `done`. Exactly 276 `done` actions have an outcome reference; 4,671 non-done actions separately have outcome references. The legacy view incorrectly divided 4,947 all-status linked rows by 317 `done` rows and reported 15.6057 (1,560.57%). Comparable-cohort coverage is **276 / 317 = 0.8707 (87.07%)**, leaving 41 terminal actions without recorded outcomes.

## Narrow change
Reuse the same public view, no extra cron or parallel memory. Both counts use the exact `status=done` population, one source scan. On zero completed actions, coverage is NULL/unobserved, not a false 100% green. The existing canonical forecasts, observed outcomes, calibration and contract remain, with coverage definition added to metadata. Preserve security_invoker and revoke browser access. Assert accurate readback and range [0,1] transactionally.

## Strict release
The migration is **not live** until exact-head protected Required CI/CodeQL, provider-owned Supabase preview and merge succeed. Existing preview capacity is occupied by unrelated work, which must not be deleted/reused without authorization. Verify real production ratio and invoker/ACL after merge. Keep learning on existing #4198, avoiding false greens and unsanctioned writes.
