# Canonical runtime scheduler — unreachable cron slots (2026-10-19)

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478

Production evidence: job 171 `powerhouse-runtime-scheduler-mux-v1` fired at 01/06/11/16/21/26/31/36/41/46/51/56 only; the v1/v2 functions also define valid work at minute residues 3 and 4 which were mathematically unreachable. The daily prediction-learning audit at 06:04Z was missed. Manual audit evidence on 19 October: 7,041 forecasts, 385 due, 247 unresolved; no fabricated score improvement.

This **single existing canonical scheduler** continues using the same job name/command/advisory lock/runtime evidence table, now includes minute residues 1,3,4. Baseline watchdog/reconciliation remain conditional on residue 1 (12/h unchanged). Exact-minute tasks and source dispatch are unchanged, with no shadow job and no bypass of the 30s statement timeout. The previous 12 slots are all preserved.

Rollout gate: verify native Node reachability tests, Required CI + CodeQL, protected merge, apply migration from main only, read back the exact cron schedule and public function, observe one actual slot-3 and slot-4 `runtime_scheduler_run_evidence_v1` run with canonical `COMPLETED` / honest task failure, and prove the next daily `prediction-learning-audit` event was recorded. Keep failing tasks open rather than labeling the scheduler healthy from a cron row alone. If an added slot exceeds timeout, rebalance within the **same mux**, never create a parallel scheduler.

This migration intentionally does not solve Tavily HTTP 432 usage quota, stale external source evidence, revenue snapshot timeout, missing customer-finance forecasts, or portal PR #4475 production acceptance.


## Supabase branch source divergence — true resolution boundary

A manually-created isolated development branch on 2026-10-19 replayed production's historical migration record `20261006085416` and stopped on `CRON_PRESSURE_CONTRACT_JOB_MISSING:powerhouse-identity-graph-v1` (SQLSTATE P0001). That branch had 568/714 migrations. However, read-only inspection of two **existing GitHub-integrated branches** (for other PRs, not modified here) shows that the same migration has **different archived SQL** and no hard abort, despite having the same version/name. This distinguishes a manual branch replay source from the hosted GitHub PR preview source.

| Environment | Archived SQL MD5 | Historical cron hard abort | Meaning |
| --- | --- | --- | --- |
| Production | `6e4aa572b4c8f5bb4091958db833eba3` | Yes | Production history was recorded with older body |
| Git-linked branch for PR #4441 | `69bebb24ab2651a4fd3f3bf92c5b9790` | No | Version-controlled replay follows updated body |
| Git-linked branch for PR #4370 | `69bebb24ab2651a4fd3f3bf92c5b9790` | No | Independent corroboration of the distinct source |

**Recovery correction:** the proposed earlier `20261006085100_legacy_cron_replay_preconditions.sql` and its test were removed from this PR. They attempted to recover three legacy cron tasks for an error only reproduced using a **different** migration source; adding such jobs to current Git-linked previews is unnecessary and risks duplicating scheduled work. No production data, migration ledger, existing branch, branch-protection requirement, or runtime cron job was mutated by this diagnostic correction.

The canonical prevention in `tools/ci/supabase-preview-diagnosis.mjs` retains **fail-closed** classes `MIGRATION_ARCHIVED_CRON_PRECONDITION` and `PREVIEW_CAPACITY_EXHAUSTED`, both with regression tests. Before treating future errors as the same bug, inspect actual source selection and archived SQL by environment, not migration version alone. Do not promote a passing manual SQL rollback test to equivalent native GitHub Preview evidence.

**Release still blocked** until the Supabase-owned `Supabase Preview` check is a genuine `success` on the exact candidate head. PR #4479's provider check remained `skipped` because of concurrent preview branch capacity / PR association; no synthetic check or override is permitted. Then require Required test, CodeQL, protected CAS merge, real database promotion and authenticated production runtime readback.

## Permanently enforced archived-source divergence diagnosis

On 2026-10-19 at ~15:10 UTC, production `supabase_migrations.schema_migrations` returned archived version `20261006085416`, name `stagger_cron_database_pressure_v1`, **stored MD5 `6e4aa572b4c8f5bb4091958db833eba3`** and hard `CRON_PRESSURE_CONTRACT_JOB_MISSING` exception. GitHub file of the same name/version no longer throws. This mismatch is persistent until a supported provider reconciliation is proven. The latest candidate adds two **fail-closed** diagnoses to `tools/ci/supabase-preview-diagnosis.mjs`: `MIGRATION_ARCHIVED_CRON_PRECONDITION` and `PREVIEW_CAPACITY_EXHAUSTED`, with regression tests. The canonical `powerhouse-delivery-concurrency` skill now demands comparison of provider-archived SQL to repository SQL before attempting repair. Provider-native preview SUCCESS is still required; no green override or production release on this branch.
