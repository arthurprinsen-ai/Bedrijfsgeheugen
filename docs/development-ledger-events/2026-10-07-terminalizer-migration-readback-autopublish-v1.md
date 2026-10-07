# 2026-10-07 — Terminalizer migration readback autopublish

- Obligation: `terminalizer-migration-readback-autopublish-v1`
- Trigger: PR #4075 post-merge terminalizer attempt 1 failed because the exact Supabase migration was already heading toward/at provider-applied state while the required PR readback marker was not yet present.
- Root cause: the migration terminalizer consumed the marker once, while the existing Supabase production authority did not publish migration readbacks.
- Structural correction:
  - reuse the existing protected-main Supabase production authority;
  - resolve exact timestamped migration files;
  - observe exact version + name through Supabase Management API migration history;
  - append the canonical APPLIED marker to the merged PR;
  - let the terminalizer wait in a bounded 24 × 5 second convergence window;
  - remain fail-closed after the bounded window.
- Runtime impact: none; this is delivery/evidence control-plane logic only.
- Regression: `tests/brain-supabase-migration-provider-readback-publisher-v1.test.mjs`.
- Historical recovery evidence: terminalizer run `37671638045` attempt 2 succeeded after exact provider evidence was written.
