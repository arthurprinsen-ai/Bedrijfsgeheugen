# 2026-10-07 — Terminalizer migration readback autopublish

- Obligation: `terminalizer-migration-readback-autopublish-v1`
- Trigger: PR #4075 post-merge terminalizer attempt 1 failed although the exact Supabase migration was APPLIED.
- Root cause: migration terminal evidence depended on a PR-body provider marker, but no canonical owner produced that marker automatically.
- Structural correction:
  - keep the existing post-merge obligation terminalizer as the single migration readback owner;
  - for exact timestamped migration files, query Supabase provider migration history with bounded retries;
  - require exact version + exact migration name;
  - append the canonical APPLIED marker to the merged PR;
  - consume that exact marker in the same terminalization lineage;
  - remain fail-closed when provider evidence is absent.
- Security boundary: the read occurs only after protected merge, in the production environment, and the provider token is passed only to the migration-readback step.
- Edge deployment authority: unchanged.
- Runtime impact: none; this is delivery/evidence control-plane logic only.
- Regression: `tests/brain-supabase-migration-provider-readback-publisher-v1.test.mjs`.
- Historical recovery evidence: terminalizer run `37671638045` attempt 2 succeeded after exact provider evidence was written.
