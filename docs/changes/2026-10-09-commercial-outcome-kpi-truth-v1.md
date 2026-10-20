# P0 #4198 — separate operational events from commercial outcomes everywhere

## Real source defect
Both existing `powerhouse_full_cycle_production_proof` and `powerhouse_autonomous_growth_revenue_cycle` called 1,369 raw `powerhouse_sales_outcomes` events observed outcomes. Most are `not_executed`/`execution_completed`; earlier source and conversion-table migration already removed 1,349 false derived conversion and lead projections. Raw events remain for audit, but not every event is a business outcome.

## Minimal scoped change
Change ONLY these existing two RPCs' outcome counters to count explicit qualifying lifecycle events or observed positive economic revenue. The autonomous growth opportunity touchpoint count additionally excludes `not_executed`, internal execution-completed and no-response markers. No alteration to forecast provenance, scheduler, CRM or original event history. Economic EUR sums remain evidence-based. Do not count test replies as actual SalesRobot results.

## Release contract
Re-run regression test, Brain learning admission, CodeQL, Supabase Preview, protected main merge. Apply exact committed SQL to original Supabase production, read back both function bodies, verify corrected number in full-cycle proof and autonomous growth result, no impact on immutable raw event count. P0 closed only after separate omnichannel provider-readback and genuine external response/revenue learning.
