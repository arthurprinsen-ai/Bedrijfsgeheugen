# Canonical scheduler #171 — historical result evidence

Date: 2026-10-20. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478. Candidate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4565.

## Existing-state and observed truth

The original `powerhouse-runtime-scheduler-mux-v1` cron (job ID 171) was made reachable through merged PR #4479: minutes with residues 1, 3 and 4 modulo five (36 slots/hour). In the latest complete hourly control, 37 out of 37 examined due slots had healthy persisted evidence. This is **current cadence recovery**, not historical outcome recovery.

In the rolling 24-hour record, roughly 233 historical slots lacked scheduler runtime evidence: a sampled classification found 133 with a failed cron record and 99 without a cron record for the matching minute. Another 17 recorded internal task failures. Precise counts vary as the window advances. Startup timeouts and a database restart were observed. All 307 unique cron-failure reviews were triaged into existing `powerhouse_ops.cron_failure_triage` without authorizing replay; 23 outstanding triage queue states were closed as triage complete with `UNRESOLVED_*` result flags retained.

## Proposed durable proof design

Use one new private operational table `powerhouse_ops.runtime_scheduler_gap_ledger_v1`, unique by scheduler job and UTC minute. Record the source cron run ID, runtime task results (when present), classification, and typed unresolved result obligation. A separate bounded, private, manual-invocation function captures up to 48 hours of gaps; there is **no second scheduler**, no external provider action, and no automatic replay. This is a diagnostic/closure enabler, not an assertion that lost actions happened.

## Closure contract

For each historical slot, compare expected task to its canonical output and provider ACK. Use `PROVEN_BACKFILLED` only for fresh authorized, idempotent readback-verified internal catchup, `PROVEN_SUPERSEDED` only when an independently verified later result covers the same required data, or `NO_SAFE_BACKFILL` when replay cannot be safely justified. All historical assertions retain source references; never mark an unknown effect completed.

At 2026-10-20, daily revenue execution remains degraded: company LinkedIn and blog have LIVE_PROVEN receipts, but Instagram lacks a verified media asset and personal LinkedIn remains duplicate-blocked. Prediction audit ran at 06:04 UTC but 356 overdue calibration obligations have zero qualifying resolution candidates; absent observed outcomes must not be treated as negative events.

Release gates: native Supabase Preview, Required test, CodeQL, protected merge, exact-main production migration readback, one authorized bounded proof capture, and at least two independent healthy windows. Never disable existing scheduler or bypass consent, idempotency, or tenant isolation.
