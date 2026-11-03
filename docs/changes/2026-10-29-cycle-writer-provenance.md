# Canonical cycle-event writer provenance — 29 October 2026

Obligation: `powerhouse-lean-agent-loop-20261029` · Follow-up candidate: `2c1ecc77-58aa-4f25-ae68-e2337853fdc7`
Status: MIGRATION_SOURCE_CANDIDATE / NOT LIVE

## Diagnosis

Read-only Supabase introspection found 315 recent sales action signal/analysis/prediction/decision events per stage; 290 execution events and few channel/runtime events. None had top-level `agent_id`, `before_metric`, `after_metric`. Evidence is present elsewhere but does not prove a real AI executor identity. Commercial outcomes in prior 14 days recorded no positive revenue; **do not invent sales or revenue**.

## Change

One guarded `CREATE OR REPLACE FUNCTION` migration updates the five existing SECURITY INVOKER PostgreSQL cycle materializer functions. Twenty-one future event calls receive `writer_component=public.<function_name>`, `writer_contract_version=v1`, and `agent_attribution=UNKNOWN_NOT_ATTESTED`. SQL writer provenance is proven by the function that constructs the payload, not inferred from the source entity. **writer_component is not agent_id.**

No existing event is updated, no RLS/policies/grants or `SECURITY DEFINER` modes are changed, no schedule/trigger/table/worker is added, and sales truth and idempotency checks remain intact. Tested with source-contract assertions and requires protected PostgreSQL 17 migration replay and provider-applied migration readback. If deployment identity/migration history is inconsistent, stop rather than force.

## Remaining work

Source agents must pass genuine agent identity, skill version, baseline, independent after metric, customer result and revenue evidence along their existing canonical lineage. The observability UI from PR #5105 will continue to show unknown agent fields until those source contracts are independently verified. Do not report the full loop GREEN or LIVE from this limited provenance migration alone.

## Security contract correction

The hosted Supabase source-contract preview initially rejected attempts to re-define two pre-existing privileged source-entry functions. Those functions are EXCLUDED from this migration, not marked PUBLIC_INTENTIONAL and not granted any new permissions. A dedicated review of direct source-entry function authorization is separately required. The present migration covers 5 unprivileged functions and 21 event constructions. All historical signal events and downstream dispatch conditions remain unchanged.
