# 2026-11-03 — original ONE BRAIN incident pattern completeness debt
Parent P0: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198)

## Independent source diagnosis (production)
Original source `public.brain_failure_registry`: after the first 80 documentary source-evidence backfills, 230 OBSERVED, 80 missing root causes, 86 prevention rules and 125 regression references. A further 9 narrowly source-backed patterns were corrected **using the original version-checked `brain_promote_failure` RPC**, with 7 cause, 3 prevention and 3 regression-reference fields. Independent production SQL after readback: **230 OBSERVED; 73 missing root causes, 83 prevention rules, 122 regression references**. The maturity and unproven fix states were not changed. No event was deleted and no duplicate scheduler, writer or incident store was created.

The hourly existing `intern.bg_brein_zelfbewaking()` produces `OBSERVED` symptom occurrences from the original `intern.bg_brein_status_oordeel` view. It does not require RCA or tested prevention evidence when observing a failure. The underlying `intern.bg_brein_status` view sometimes derives GREEN from `brain_delivery_evidence`, not merely the `cron.job_run_details` transport conclusion. Thus a successful cron and missing business effect are **distinct**, and `NOOIT_BEWEZEN` cannot be promoted by a successful cron run alone. `brein-status|pg_cron|FOUT` merges heterogeneous failed jobs into one fingerprint; only original job/run-level evidence can establish a particular root cause.

## Protected candidate
- `brain/observability/failure-backlog-assurance-v1.mjs`: read-only exact-count incident debt triage; repeated current fingerprints first; stale one-offs remain historical evidence, not automatically live incidents. No network, database writes or provider side effects.
- `scripts/brain/chat-learning-preflight.mjs`: existing original preflight receives optional `failureRegistryEvidence` with exact count and only exports aggregate status and totals; never exposes raw fingerprints. Without full source evidence status is `SOURCE_COVERAGE_UNVERIFIED`, **not green**.
- Original `brain/policies/powerhouse-incident-register-and-self-fix-v1.json` is extended with mandatory fail-closed protocol and machine-tested preservation.
- New replay and updated original preflight tests cover missing fields, placeholder laundering, duplicate/incomplete readback, recurrence prioritization, older issues, and tenant-safe projection. Pure helper local test: 6/6 passed. GitHub protected release results not yet claimed.

## Original owner execution requirement
1. Use the original ONE BRAIN/Heartbeat agent and skill, no parallel observer/scheduler. Read exact Supabase count + complete rows in a bounded private server context, fail closed on mismatch/provider timeout. No raw fingerprints or evidence to customer-facing UI.
2. For all 73/83/122 remaining missing fields, open or update original fingerprint owner recovery. Each root cause needs original event/provider/cron job evidence, not status-label inference; prevention needs causal fix; regression needs executable source test **and evidence it passed**. Historical OBSERVED is a quality debt, not necessarily an active production outage.
3. Keep original safe owner writer lease and CAS. No bulk overwrite, no invented cause, no placeholder text to hide metric, no unsolicited external send. Require valid exact-source replay, protected Required/BRAIN/CodeQL/System Map, merge, deployment/provider receipt, next natural run, later non-recurrence audit, skill application and customer-visible truthful aggregate readback.
4. Route old recurring `pg_cron`, `bg-experimentcyclus`, `bg-native-content-generate`, and source telemetry gaps to original functional owner. A cron success alone cannot prove channel publication, experiment effectiveness or client benefit.

## Status
**Source documentary reconciliation verified in production** for 9 records. **New code candidate, not merged/live until native protected checks.** Underlying provider, business outcome and recurrence closures remain OPEN. Do not treat a cleaner dashboard as incident resolution.
