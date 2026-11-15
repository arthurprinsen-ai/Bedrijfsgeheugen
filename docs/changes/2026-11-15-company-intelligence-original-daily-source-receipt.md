# Original Company Intelligence daily invocation — exact source receipt, no repeated outreach

**Source-of-truth incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

## Native production diagnosis

- `public.powerhouse_run_company_intelligence_os_v1(date)` exists, yet **0** original `company_intelligence_os_cycle` runtime events.
- Existing daily job **#107** executes `public.powerhouse_run_self_improvement_layer_v1(date)`; that daily function read company projections and displayed `company_intelligence_authority` as a string but did **not** invoke the OS. A label is not an actual agent execution receipt.
- Original acquisition runtime source `public.powerhouse_runtime_events` already contained **48** `trigger_based_mkb_acquisition_cycle` events over the previous 48 hours with source quality `VERIFIED`, latest exact existing event `trigger-based-mkb-acquisition:2026111516`. Its evidence explicitly said `external_outreach_executed=false`. This is evidence of commercial source processing, **not** a provider GET, paid customer result, or financial optimization.
- The legacy OS function directly called `public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)`, which performs 14 commercial workflow stages including outreach. Wiring it into the daily writer without changing it would create duplicate outreach risk.

## Repair in the same daily owner

The original Company OS becomes a **same-day read-only observer of the original already-executed commercial source event**, using the original source event ID, dedupe, source, data-quality and business-date. It creates one idempotently upserted `company-intelligence-os:YYYY-MM-DD` record in the **existing runtime event store**, classified as `SOURCE_RECEIPT_ONLY` or `SOURCE_EVIDENCE_DUE`; **never** `VERIFIED` customer value from its own receipt. Do not re-call any commercial dispatcher.

The original daily self-improvement function (already scheduled by #107) actually invokes that Company Intelligence observer after its canonical innovation intake and context readback. It embeds the source status, original event ID and explicit no-send/financial-proof-due assertions in the existing daily `self_improvement_cycle` record. Errors are typed and prevent a false-green combined status.

The Company OS source snapshot includes real counts from existing `portal_financial_forecasts_v1`, `powerhouse_realized_values`, `powerhouse_action_economics` and `powerhouse_optimization_candidate_v1`. Their zero or missing amounts **do not become verified net savings**. No new cron, provider, agent, queue, table, artificial rate or financial estimate. Existing portal tenant/RLS boundary remains unchanged; this global runtime snapshot must not be exposed directly as a customer-tenant report.

## Acceptance

- Original regression: `tests/brain-company-intelligence-daily-source-receipt-20261115.test.mjs`. Native protected Supabase preview, admission, backend, CodeQL and exact main merge.
- After merge independently inspect `supabase_migrations.schema_migrations`, original daily cron #107 enabled, original same-day Company Intelligence event `company-intelligence-os:2026-11-15` with **matching original commercial source event ID**, no second provider send and its same-day self-improvement source readback.
- Preserve its OPEN status when original company input or consumer proof is missing. Keep original financial ONE BRAIN obligation `8a0a5a8d-595f-4bb1-8522-14a9507cb7f7` open until real cost/operational source, permissible reversible execution, independent provider/Heartbeat counterfactual net effect and subsequent decision are observed.
