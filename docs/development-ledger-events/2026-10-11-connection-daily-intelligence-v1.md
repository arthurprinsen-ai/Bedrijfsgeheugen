# Development ledger event — 2026-10-11

**Obligation:** P0-4198-CONNECTION-DAILY-PULSE  
**State:** PROPOSED; production migration and 100% coverage not yet verified.

## Observed evidence
- `public.bg_connecties`: 23,295 eligible contacts.
- `public.powerhouse_connection_enrichment_coverage_v1`: initially 0 enriched today, subsequently 2,550 and 3,050 after bounded manual runs.
- `cron.job_run_details` for job 116: multiple statement timeouts on 2026-10-11 during expensive commercial scoring.
- Existing `powerhouse_refresh_connection_enrichment_batch_v1`: executes bounded batches, but repeating eight batches in one transaction timed out and did not prove daily completion.
- Existing `powerhouse-identity-graph-v1` cron job 138: observed as successful hourly before proposed change.

## Proposed change
Use existing job 138 at minutes 02, 17, 32, 47. Retain graph sync at minute 32; append bounded contact assessment and date-stamped advisory decision to canonical enrichment state. Add two expression indexes for normalized company evidence. Do not infer fresh LinkedIn searches, provider sends, or conversions from internal snapshots.

## Proof obligations
Protected GitHub checks, migration deployment and SQL readback, cron execution readback, 23,295/23,295 same-day reviews, authorized source refresh and separately verified external sends/outcomes.

## Recovery rule
On failure keep other channel executors active; retry only the incomplete bounded contact segment. No duplicate CRM, scheduler, email, or DM workers.
