# Bedrijfsgeheugen — customer value briefing v1
Date: 2026-11-01. Parent P0: #4198.
Scope: original Portal V2 / ONE BRAIN / Powerhouse / Heartbeat only. This is a code candidate, **not** a deployed claim or a proven increase in customers, profit or revenue.

## Production diagnosis
Read-only Supabase observations (2026-11-01, live database):
- powerhouse_sales_outcomes: **8,036** rows; **7,491** not_executed, **488** execution_completed, **20** sent; **zero** rows with positive revenue_eur. Other rows include engagement, replies and scans.
- powerhouse_business_value_intelligence_v1: **10,772** actions, all business_value_status=no_resource_evidence; zero with positive realized_revenue_eur.
- brain_value_evaluations: 2 PENDING, 1 DUE, zero verified.

**Root cause/product gap:** a large number of activity and technical output records exists, but user-specific verified economic outcomes, paid orders and attributable improvement are not established. Treating execution or engagement as company value undermines customer trust. An additional autonomous scheduler/brain cannot repair missing buyer, payment, baseline and independent proof.

## First bounded correction
- Add a read-only customer-value briefing to the existing authenticated Executive Cockpit, reusing its canonical tenant-scoped evidence-filtered projection, original Next Best Actions and outcomes.
- Show a single source-backed *eligible* action with the problem, next owner step, explicit success metric and baseline (or their absence), estimated value separately from measured effect, and approval requirement.
- A verified result must match the exact action ID and have a terminal independent status, healthy sources, explicit amount, unit, metric, baseline and period. It is still an observational result, **not** necessarily attributed causal uplift or a paid order.
- Learning is shown only after separate verified learning refs and linked next decision.
- No new writer, agent, scheduler, CRM, email dispatch, SQL migration, provider access, tracking or tenant mutation. Use existing next-best-action and evidence-health routes.

## End-to-end customer benefit acceptance, still OPEN
1. Authenticated A/B tenant test: no cross-tenant evidence, blank or stale sources never generate results.
2. For each customer: baseline from actual company/financial/CRM sources, specific target, bounded intervention under original authorization policy, independent provider execution and immutable action ID.
3. At the defined horizon: compare same KPI, baseline and cohort; validate paid orders and margin via invoice/payment reconciliation, and costs separately. Learn with a documented experiment/holdout where feasible, otherwise do not claim causality.
4. Verify actual customer activation, first completed value-producing task, time-to-value, 30/90d retention and customer-confirmed usefulness through consented data, not admin pageviews.
5. Only original pipeline promotes skills after regressions, security/quality gates, customer-outcome confirmation and next-natural-run readback. Keep #4198 OPEN until genuine paid revenue/benefit.

## Release proof
Local isolated candidate 6/6 Node tests PASS before connector write; canonical GitHub branch requires fresh Required, BRAIN/Portal, CodeQL, protected merge, Netlify exact-main SHA, authenticated live browser/mobile A/B and independent next-run customer outcome evidence. No production-green assertion at this stage.
