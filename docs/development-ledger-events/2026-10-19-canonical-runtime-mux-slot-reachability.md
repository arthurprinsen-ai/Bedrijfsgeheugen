# Development ledger — 2026-10-19 — Canonical runtime mux slot reachability

- Obligation-ID: `canonical-mux-cron-reachability-20261019`
- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478
- Source evidence: live `cron.job` job 171 only triggered residue 1 in modulo-5 minutes; runtime function predicates at residues 3/4 were mathematically unreachable.
- Before change: production audit had to be executed manually on 19 October; 7,041 forecasts, 385 due, 247 unresolved. This is observation, not backfilled improvement.
- Root cause: clock-slot contract drift between the single authorized scheduler and its v1/v2 task predicates, not a missing worker or tenant grant.
- Material change: in-place `cron.alter_job` for the one canonical job, plus baseline watchdog/reconciliation gating to the original slots only. No additional cron, secret, synthetic source signal, or bypass.
- Regression: `tests/brain-runtime-scheduler-reachability-20261019.test.mjs`, with mandatory historical-replay evaluation in the learning contract.
- Remaining release condition: Required CI + CodeQL, protected merge, production SQL migration, actual scheduled slot-3 and slot-4 evidence, then next daily audit at 06:04 UTC. Unknown until observed.
- External Tavily HTTP 432, financial customer evidence gaps, and revenue intelligence SQL timeouts remain distinct incidents.

## Additional recovery evidence — hosted clean-room replay

- New provider branch run observed `MIGRATIONS_FAILED` at archived remote version `20261006085416`: `CRON_PRESSURE_CONTRACT_JOB_MISSING:powerhouse-identity-graph-v1` (SQLSTATE P0001). Production 714 migrations; failed preview 568. The already-corrected local historical SQL is **not** the archived remote SQL.
- Re-read remote history: three expected jobs lacked any preceding archived migration mention: identity graph, connection activation daily, content orchestrator daily; all three are real live production jobs (the current canonical mux runs separately).
- New additive migration `20261006085100_legacy_cron_replay_preconditions.sql` explicitly precedes the old guard and restores only real legacy tasks if the modern mux does not exist. This cannot be declared production-proven without official provider-owned fresh replay and strict protected merge.
- Prior temporary paid preview was deleted with independent branch-list readback; no accumulating paid preview environments left by this recovery.
- Regression: `tests/brain-runtime-scheduler-legacy-replay-preconditions-20261019.test.mjs`; existing reachability regression retained.


## 2026-10-19 15:10 UTC — canonical prevention writeback

- Read original archived Supabase `20261006085416` via the authorized production connector and compared against current repo. Archived SQL hard abort `CRON_PRESSURE_CONTRACT_JOB_MISSING` remains; production provider archive digest `6e4aa572b4c8f5bb4091958db833eba3`. Repo script with same migration version skips missing jobs, so version/name parity does not mean SQL or replay parity.
- Extended existing Supabase provider check diagnosis to classify this case and provider preview capacity exhaustion separately, both strictly red. Added regression coverage to existing `tests/brain-supabase-preview-diagnosis-v1.test.mjs`.
- Persisted prevention in `brain/learning/2026-10-19-canonical-runtime-mux-cron-reachability-v1.json` and `.agents/skills/powerhouse-delivery-concurrency/SKILL.md`. No synthetic proof, no ledger manipulation, no bypass, and no duplicate scheduler.
- Current rollout state is `PENDING_PROTECTED_MERGE_AND_PRODUCTION_READBACK`, and P0 incident #3742 remains open pending supported Supabase archive/replay reconciliation.
