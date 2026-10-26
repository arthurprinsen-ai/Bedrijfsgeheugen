# Bounded Janitor cleanup

Obligation-ID: janitor-bounded-cleanup-20261026

Change: cap Actions and branch enumeration in `Reconcile stale Actions and merged branch debris` to a single 30-entry page per status and per branch sweep. The page advances deterministically with the canonical GitHub workflow run number modulo 32. Job timeout: 15 minutes. Mutations preserve read-before-write safeguards and never target protected main. Existing `branch_reconciler` job remains independent.

Trade-off: this is a bounded round-robin cursor rather than durable checkpoint storage. Large repositories beyond 32 pages require an expanded page window; repeated GitHub runs eventually cover each eligible page. No production completion claim without provider readback.
