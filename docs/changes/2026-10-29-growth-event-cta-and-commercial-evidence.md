# CRO event processing, experiments and independently evidenced commercial results

**Owner:** existing Powerhouse Growth/SEO + ONE BRAIN + Heartbeat. **Scope:** canonical.
**Root-cause fingerprint:** `powerhouse|cro|cta-event-alias-mismatch|20261029`.
**Related existing incident/owner:** #4446. **Implementation:** current protected PR; not live by writing a branch.

## Observed production evidence — 2026-10-29
- `growth_events` 222,770 rows, of which 12,144 observed within 7 days and 7,786 without the bot flag. A non-bot flag is **not** independent human identity verification.
- `commercial_leads` 0 rows. `powerhouse_experiment_assignments` 1 row. `powerhouse_experiment_policies` 1 active policy for revenue messaging, **not** consent to start arbitrary website experiments.
- `growth_outcomes` contains 1 historical `lead` and 0 `won_order` outcomes; the last 30 days of `powerhouse_sales_outcomes` were dominated by `not_executed` (6758) and `execution_completed` (404), with no positive revenue. These are NOT 7,186 proven orders.
- The website emits `primary_cta_click`, `money_link_click`, and `secondary_cta_click`, while existing `bg_growth_ingest_event` counts only `cta_click` and two other aliases in `growth_page_daily`. This directly explains at least part of the zero-CTA dashboard discrepancy. Historical events remain governed by exact persisted IDs.

## Implemented in branch
1. Migrate the **existing** `bg_growth_ingest_event` aggregation to include these event types, without changing the sole ingestion RPC, producer, or scheduling.
2. Reconcile historical non-robot event IDs conservatively with `GREATEST` rather than counting a duplicate twice or erasing independent existing metrics.
3. Require an exact datahub table, event/outcome ID, queue ID, and mutually exclusive stored/deduped flags before marking a Netlify growth receipt persisted. HTTP success alone is not evidence. Failure retains the durable queue for bounded retry.
4. Project aggregated existing source data in service-role-only, security-invoker views `powerhouse_cro_conversion_evidence_v1` and `powerhouse_cro_experiment_evidence_v1`. No parallel event table or scheduler.
5. Keep `form_submit_intent` separate from an actual form submission, consented contact, qualified lead, signed order and paid invoice. An order with metadata only is not independently confirmed until source/provider readback.

## Remaining release and business proof obligations
- Exact-head protected Required, BRAIN, CodeQL and migration verification; no privilege or merge bypass.
- Merge on main, Netlify exact deployed SHA, Supabase migration ledger, browser consent-denied/consent-granted event, Netlify durable receipt AND independently fetched Supabase `growth_events.event_id` matching the same event.
- Validate two authenticated portal tenants (owner visibility and forbidden cross-tenant read). New views are service-role-only; do not hand keys to browsers.
- During the following natural measurement run, verify emitted click -> persisted event -> corrected daily CTA counter, bot filters and event timestamps. No synthetic test traffic counted in business metrics.
- Before experiment promotion: preregister hypothesis, success metric, exclusion/guardrails, 50/50 (or stated) random assignment, sample ratio mismatch test, minimum matured samples for both arms, measurement window, statistical uncertainty, and independent order/lead outcomes. Keep inconclusive experiments `INSUFFICIENT_EVIDENCE`.
- A real commercial lead requires a successful valid-contact record plus linked outcome and real permission; paid order requires corresponding contract/invoice/payment-provider evidence and independent provider readback. No fabricated conversions or revenue.
- After verified readback, update the existing portal **Data & intelligence → Andere data** (PR #5140), Brain record and skill runbooks. This PR does not attest that PR #5140 is merged/live.

**Rollback:** revert protected migration/code via new PR and run tests; do not delete event receipts, rewrite historical evidence, create a new scheduler, reclassify failed ACKs as successful, or reset consent.

## CI admission correction
The initial #5143 Required run was rejected by the preflight parser with `PR_MACHINE_METADATA_INVALID:BASE_SHA_INVALID,BASE_SHA_MISSING`; this was a missing machine header in the PR description, not evidence that the actual datahub tests had failed. The exact original branch parent is `1a7dbb3ddacef863f4fcb58b91868edd2cb0676c`. The PR metadata now includes this immutable base. Admission, conflicts, lease, protected checks, PostgreSQL migration, and deployment remain separate gates requiring fresh validation.
