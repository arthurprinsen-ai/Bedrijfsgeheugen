# Canonical runtime scheduler — unreachable cron slots (2026-10-19)

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478

Production evidence: job 171 `powerhouse-runtime-scheduler-mux-v1` fired at 01/06/11/16/21/26/31/36/41/46/51/56 only; the v1/v2 functions also define valid work at minute residues 3 and 4 which were mathematically unreachable. The daily prediction-learning audit at 06:04Z was missed. Manual audit evidence on 19 October: 7,041 forecasts, 385 due, 247 unresolved; no fabricated score improvement.

This **single existing canonical scheduler** continues using the same job name/command/advisory lock/runtime evidence table, now includes minute residues 1,3,4. Baseline watchdog/reconciliation remain conditional on residue 1 (12/h unchanged). Exact-minute tasks and source dispatch are unchanged, with no shadow job and no bypass of the 30s statement timeout. The previous 12 slots are all preserved.

Rollout gate: verify native Node reachability tests, Required CI + CodeQL, protected merge, apply migration from main only, read back the exact cron schedule and public function, observe one actual slot-3 and slot-4 `runtime_scheduler_run_evidence_v1` run with canonical `COMPLETED` / honest task failure, and prove the next daily `prediction-learning-audit` event was recorded. Keep failing tasks open rather than labeling the scheduler healthy from a cron row alone. If an added slot exceeds timeout, rebalance within the **same mux**, never create a parallel scheduler.

This migration intentionally does not solve Tavily HTTP 432 usage quota, stale external source evidence, revenue snapshot timeout, missing customer-finance forecasts, or portal PR #4475 production acceptance.


## Hosted Supabase replay blocker and additive precondition

At 2026-10-19 14:33:59 UTC, a real provider-owned branch replay stopped on stored remote migration `20261006085416` with `CRON_PRESSURE_CONTRACT_JOB_MISSING:powerhouse-identity-graph-v1`. The remote archived migration contains an unconditional `RAISE EXCEPTION`, while the GitHub version already tolerates missing legacy jobs, so changing only the GitHub text of that historical file cannot by itself prove replay. The newly created branch had 568/714 production migration records; there were no preceding archived references to three asserted scheduled jobs.

The new, **additive and version-ordered** migration `20261006085100_legacy_cron_replay_preconditions.sql` attempts to reinstate the three *real* historical cron activities immediately before the archived assertion, only if the modern canonical scheduler is not present and the legacy jobs are absent. It cannot rewrite remote Supabase migration history, it does not create a second canonical mux, and production already has the modern mux, so replay of this migration must be a no-op there. The source-evidence replay contract is in `tests/brain-runtime-scheduler-legacy-replay-preconditions-20261019.test.mjs` and canonical learning.

**Acceptance remains RED until a fresh provider-owned Supabase branch proves this earlier migration is actually included before its stored historical 20261006085416 block**. Supabase provider check must be success on exact PR head (not skipped); run source security and protected checks before merge. Do not directly edit `supabase_migrations.schema_migrations`, use empty placeholder migration files, infer provider association from the branch name, or promote a successful static test as production proof. If the provider hydrates only its archived ledger before applying Git files, this migration will not unblock it; supported provider baseline/replay reconciliation is then the hard boundary.


## Permanently enforced archived-source divergence diagnosis

On 2026-10-19 at ~15:10 UTC, production `supabase_migrations.schema_migrations` returned archived version `20261006085416`, name `stagger_cron_database_pressure_v1`, **stored MD5 `6e4aa572b4c8f5bb4091958db833eba3`** and hard `CRON_PRESSURE_CONTRACT_JOB_MISSING` exception. GitHub file of the same name/version no longer throws. This mismatch is persistent until a supported provider reconciliation is proven. The latest candidate adds two **fail-closed** diagnoses to `tools/ci/supabase-preview-diagnosis.mjs`: `MIGRATION_ARCHIVED_CRON_PRECONDITION` and `PREVIEW_CAPACITY_EXHAUSTED`, with regression tests. The canonical `powerhouse-delivery-concurrency` skill now demands comparison of provider-archived SQL to repository SQL before attempting repair. Provider-native preview SUCCESS is still required; no green override or production release on this branch.
