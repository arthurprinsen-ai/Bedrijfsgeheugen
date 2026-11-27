# Company Intelligence OS — independently sourced Outcome Memory truth (2026-11-15)

Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215  
Original learning fingerprint: `powerhouse|outcome-memory|nonempty-evidence-false-green|20261115-v1`.

## Production truth, before change

- Original private `public.powerhouse_outcome_memory_v1` had **11,618 verified=true** sales outcome rows because `evidence != '{}'`. That is metadata presence, not an independent provider/customer observation.
- Original `public.powerhouse_sales_outcomes` contains 10,764 `not_executed`, 796 `execution_completed`, 21 `sent`, 14 `linkedin_engagement`, 3 `reply` and other events. A send or internal terminal is not a customer's measured economic outcome.
- **11,560** historical records contain `synthetic_business_result=false` (not true), so these are not declared synthetic by that flag, but it does not establish independent outcome verification.
- Exactly **14** `linkedin_engagement` rows have `source_data_quality=VERIFIED` plus source event ID/type/dedupe that join to **the same original** verified `powerhouse_runtime_events` with matching company/person and causal timestamp. Seven provider send receipts with complete message ID can prove sends, not customer benefit. All **11,618** `revenue_eur` values are zero, **0** positive revenue.
- Original `powerhouse_realized_values` and financial forecast source rows both **0**. Original `company_intelligence_os_cycle` runtime events **0**; resource and self-improvement crons can be operational without proving original Company Intelligence economic execution.

## Same authority correction

Replace **the existing** `powerhouse_outcome_memory_v1` security-invoker view with identical columns, type/order, grants (`service_role` only), and a verified predicate that joins the exact original trusted runtime event. Exclude `sent`, `not_executed`, `execution_completed` from independently measured customer outcomes. An event without exact source ID/type/dedupe, validated original company/person/time, source evidence and `VERIFIED` classification remains unverified. Realized values require independently measured amount and baseline/period/source revision.

Correct original pure JS `buildOutcomeMemory` to request independent source-event readback rather than accepting `{provider:'x'}`; preserve NULL monetary value instead of `Number(value || 0)`. Reuse existing original `powerhouse_compound_intelligence_v1` consumer: it already derives learning density and counts from the verified flag. Preserve every historical source row: **no deletion or synthetic backfill**, no new scheduler/service/table/CRM/provider write.

## Safety and verification

Native provider preview must verify view creation, schema column/grants, 14 exact source-matched verified events for current unchanged snapshot, unverified historical metadata, no cross-company leakage and no false positive financial value. Required, CodeQL, original protected merge and migration-source lock must succeed. Independently query original EU production view and native migration history after merge. Keep the original financial DATA_GAP obligation **OPEN** until actual provider/customer execution, cost, counterfactual, next decision, Heartbeat and ONE BRAIN closure receipts are independently verified. A corrected verified count is not a finished autonomous company-optimization loop.

Regression: `tests/brain-company-intelligence-os-v1.test.mjs`. Original skill: `.agents/skills/powerhouse-company-intelligence-os/SKILL.md`.
