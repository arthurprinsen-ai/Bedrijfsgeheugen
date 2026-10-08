# POWERHOUSE — verified engineering-to-business-value lineage v1

## Observed production discrepancy — 8 October 2026
Existing `public.powerhouse_realized_values` contained 1,027 outcome observations. All had `value_type=conversion`, none constituted proven EUR value. In particular 947 observations had `truth_class=realized` alongside `unit=not_executed`; others were execution, send and reply statuses. These are preserved audit facts, **not revenue or verified savings**. The `brain_runtime_metrics` table was empty when inspected. A populated `powerhouse_realized_values` counter must not be treated as return on investment.

## Corrected canonical decision boundary
No new tables, schedulers, executors or learning stores. The existing pure `planCrossDomainEvolution` policy now requires, before proposing protected improvement:
1. Same tenant, change, source revision and policy versions.
2. Independently verified business and engineering outcome receipts.
3. Value metric `realized_revenue_eur` or `realized_cost_saving_eur` with numerical EUR result; the business observation must say `truthClass=realized` and must not be an unexecuted, delivery or response count.
4. A fresh finance proof on the same tenant and source revision, with kind `SETTLED_PAYMENT`, `RECONCILED_ACCOUNTING` or `VERIFIED_COST_SAVING`, source record ID, independent provider readback ID and evidence references.
5. The value observation points to a verified engineering outcome ID for the same changed revision; a financial source record is counted once.
6. The controlled comparison has an independently read-back cohort assignment and references those exact verified business and engineering outcome IDs.
7. Existing security/compliance, quality, regression, cost and latency gates remain mandatory.

Missing independent business value produces `BUSINESS_VALUE_EVIDENCE_REQUIRED`, not a green or a fake €0. Missing control linkage produces `COUNTERFACTUAL_REQUIRED`. Readback metadata alone is not substantive proof: the canonical runtime/provider must independently verify its truth before setting `verified=true`. The pure planner does not perform network verification itself.

## Acceptance and boundaries
This change is code/policy/test/skill/System Map only. It does not backfill finance data, alter historical evidence, claim any revenue, fix provider permissions, close open PRs or deploy to production. It prevents a class of false promotion decisions. Full business-value closure remains contingent on provider-sourced real finance observations, time/cost baseline and after-measurements, controlled cohort evidence, protected CI/main merge, runtime adoption and independently observed post-release effect.

Regression: `node --test tests/brain-self-evolving-business-engineering-os-v1.test.mjs`. Enforce exact-head required checks and protected delivery. No bypass or manual green status.
