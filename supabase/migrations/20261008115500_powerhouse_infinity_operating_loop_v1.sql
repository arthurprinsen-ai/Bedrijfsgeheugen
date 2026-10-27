-- POWERHOUSE Infinity: connect the seven existing capabilities through one
-- evidence-backed production loop. This migration adds no second scheduler,
-- channel executor, source authority or learning owner.

create table if not exists public.powerhouse_infinity_counterfactuals_v1 (
  counterfactual_id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  tenant_id text not null,
  run_date date not null,
  signal_key text not null,
  baseline jsonb not null,
  intervention jsonb not null,
  uncertainty jsonb not null,
  evidence jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.powerhouse_infinity_cycle_receipts_v1 (
  receipt_id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  tenant_id text not null,
  run_date date not null,
  correlation_id uuid not null default gen_random_uuid(),
  state text not null check (state in ('VERIFIED','DEGRADED')),
  components jsonb not null,
  closed_loop jsonb not null,
  commercial_proof jsonb not null,
  evidence jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.powerhouse_infinity_counterfactuals_v1 enable row level security;
alter table public.powerhouse_infinity_cycle_receipts_v1 enable row level security;

revoke all on public.powerhouse_infinity_counterfactuals_v1 from public, anon, authenticated;
revoke all on public.powerhouse_infinity_cycle_receipts_v1 from public, anon, authenticated;
grant select,insert on public.powerhouse_infinity_counterfactuals_v1 to service_role;
grant select,insert on public.powerhouse_infinity_cycle_receipts_v1 to service_role;

create or replace function public.powerhouse_infinity_reject_evidence_mutation_v1()
returns trigger
language plpgsql
set search_path to 'pg_catalog'
as $function$
begin
  raise exception 'POWERHOUSE_INFINITY_EVIDENCE_IMMUTABLE';
end;
$function$;

drop trigger if exists powerhouse_infinity_counterfactual_immutable_v1
  on public.powerhouse_infinity_counterfactuals_v1;
create trigger powerhouse_infinity_counterfactual_immutable_v1
before update or delete on public.powerhouse_infinity_counterfactuals_v1
for each row execute function public.powerhouse_infinity_reject_evidence_mutation_v1();

drop trigger if exists powerhouse_infinity_receipt_immutable_v1
  on public.powerhouse_infinity_cycle_receipts_v1;
create trigger powerhouse_infinity_receipt_immutable_v1
before update or delete on public.powerhouse_infinity_cycle_receipts_v1
for each row execute function public.powerhouse_infinity_reject_evidence_mutation_v1();

create index if not exists powerhouse_infinity_receipt_tenant_date_idx
  on public.powerhouse_infinity_cycle_receipts_v1(tenant_id,run_date,created_at desc);

create or replace function public.powerhouse_infinity_operating_loop_v1(
  p_tenant_id text default null,
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_now timestamptz := now();
  v_tenant_id text;
  v_context jsonb;
  v_company_label text;
  v_exposure numeric;
  v_signal record;
  v_impact jsonb := '{}'::jsonb;
  v_counterfactual jsonb := '{}'::jsonb;
  v_materialization jsonb := '{}'::jsonb;
  v_action record;
  v_outcomes jsonb := '{}'::jsonb;
  v_learning jsonb := '{}'::jsonb;
  v_output jsonb := '{}'::jsonb;
  v_components jsonb;
  v_closed_loop jsonb;
  v_all_operational boolean := false;
  v_provider_proven boolean := false;
  v_idempotency_key text;
  v_receipt jsonb;
begin
  select tenant_id,payload into v_tenant_id,v_context
  from public.portal_state_layers
  where p_tenant_id is null or tenant_id=p_tenant_id
  order by updated_at desc
  limit 1;

  if v_tenant_id is null then
    raise exception 'POWERHOUSE_INFINITY_TENANT_CONTEXT_REQUIRED';
  end if;

  v_company_label:=coalesce(nullif(v_context->>'branche',''),'Bedrijf');
  select greatest(0,least(1,1-coalesce(avg(value::numeric),0)/5))
    into v_exposure
  from jsonb_each_text(coalesce(v_context->'niveaus','{}'::jsonb));

  select s.* into v_signal
  from public.powerhouse_intelligence_signal_projection_v1 s
  where s.tenant_id='canonical'
    and s.observed_at>=v_now-interval '7 days'
    and (s.deadline is null or s.deadline>=p_run_date)
    and nullif(s.external_url,'') is not null
  order by (
    0.20*coalesce(s.relevance,0)+
    0.20*coalesce(s.confirmation,0)+
    0.20*v_exposure+
    0.15*coalesce(s.urgency,0)+
    0.15*v_exposure+
    0.10*coalesce(s.source_confidence,0)
  ) desc,s.observed_at desc
  limit 1;

  if v_signal.signal_key is null then
    raise exception 'POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED';
  end if;

  v_impact:=public.powerhouse_upsert_intelligence_company_impact_v1(
    p_tenant_id => v_tenant_id,
    p_signal_key => v_signal.signal_key,
    p_target_node_key => v_tenant_id,
    p_target_node_type => 'company_profile',
    p_target_label => v_company_label,
    p_relevance => v_signal.relevance,
    p_probability => v_signal.confirmation,
    p_magnitude => v_exposure,
    p_urgency => v_signal.urgency,
    p_exposure => v_exposure,
    p_source_confidence => v_signal.source_confidence,
    p_reversibility => coalesce(v_signal.reversibility,0.5),
    p_estimated_value_eur => null,
    p_estimated_loss_eur => null,
    p_impact_dimensions => jsonb_build_object(
      'domain',v_signal.domain_key,
      'company_maturity_exposure',v_exposure,
      'profile_scan_score',v_context->'scanScore'
    ),
    p_rationale => 'Observed external signal matched to the tenant company profile; impact remains an evidence-labelled inference until an outcome is measured.',
    p_evidence => jsonb_build_object(
      'contract','powerhouse-infinity-opportunity-radar-v1',
      'company_context_evidence_backed',true,
      'signal_ref','powerhouse_intelligence_signal_projection_v1:'||v_signal.signal_key,
      'source_url',v_signal.external_url,
      'tenant_context_ref','portal_state_layers:'||v_tenant_id,
      'scoring_basis','observed signal plus measured portal maturity levels',
      'inference_label','PREDICTED_NOT_OBSERVED_OUTCOME',
      'money_truth','NULL_UNTIL_EVIDENCE_BACKED'
    )
  );

  v_counterfactual:=jsonb_build_object(
    'contract','powerhouse-infinity-counterfactual-twin-v1',
    'signal_key',v_signal.signal_key,
    'baseline',jsonb_build_object(
      'arm','NO_ACTION_BASELINE',
      'expected_effect',null,
      'measurement_required',true
    ),
    'intervention',jsonb_build_object(
      'arm','CONTEXTUAL_ACTION',
      'action_key',v_impact->>'action_key',
      'expected_effect',null,
      'measurement_required',true
    ),
    'uncertainty',jsonb_build_object(
      'experiment_required',true,
      'causal_status','causal_effect_not_yet_proven',
      'source_confidence',v_signal.source_confidence
    )
  );

  insert into public.powerhouse_infinity_counterfactuals_v1(
    idempotency_key,tenant_id,run_date,signal_key,baseline,intervention,uncertainty,evidence
  ) values (
    v_tenant_id||'|'||p_run_date::text||'|'||v_signal.signal_key,
    v_tenant_id,p_run_date,v_signal.signal_key,
    v_counterfactual->'baseline',v_counterfactual->'intervention',v_counterfactual->'uncertainty',
    jsonb_build_object('source_url',v_signal.external_url,'impact_key',v_impact->>'impact_key')
  ) on conflict(idempotency_key) do nothing;

  v_materialization:=public.powerhouse_materialize_ready_intelligence_actions_v1(v_tenant_id,10);

  select * into v_action
  from public.powerhouse_intelligence_action_candidate_v1
  where tenant_id=v_tenant_id and action_key=v_impact->>'action_key'
  limit 1;

  v_outcomes:=public.powerhouse_reconcile_intelligence_outcomes_v1(v_tenant_id);
  v_learning:=public.powerhouse_run_daily_compound_learning_v1(p_run_date);
  v_output:=public.powerhouse_commercial_output_assurance_v1(p_run_date);
  v_provider_proven:=coalesce((v_output->>'commercial_day_proven')::boolean,false)
    and jsonb_array_length(coalesce(v_output->'provider_proof','[]'::jsonb))>0;

  v_components:=jsonb_build_object(
    'living_company_graph',jsonb_build_object(
      'operational',v_context is not null and v_signal.signal_key is not null,
      'tenant_id',v_tenant_id,'company_label',v_company_label,
      'signal_key',v_signal.signal_key,'source_url',v_signal.external_url
    ),
    'counterfactual_twin',jsonb_build_object(
      'operational',v_counterfactual->'uncertainty'->>'experiment_required'='true',
      'evidence',v_counterfactual
    ),
    'opportunity_radar',jsonb_build_object(
      'operational',v_impact->>'status'='SCORED',
      'impact_key',v_impact->>'impact_key','impact_score',v_impact->'impact_score'
    ),
    'decision_market',jsonb_build_object(
      'operational',v_action.action_key is not null,
      'action_key',v_action.action_key,'priority_score',v_action.priority_score,
      'decision_state',v_action.status
    ),
    'action_fabric',jsonb_build_object(
      'operational',v_action.status in ('READY','MATERIALIZED','DONE'),
      'canonical_action_ref',v_action.canonical_action_ref,
      'materialization',v_materialization,'provider_proven_today',v_provider_proven
    ),
    'evolution_engine',jsonb_build_object(
      'operational',coalesce(v_learning->>'contract','')='powerhouse-daily-compound-learning-v1',
      'outcome_reconciliation',v_outcomes,'learning',v_learning
    ),
    'trust_evidence_kernel',jsonb_build_object(
      'operational',v_provider_proven,
      'provider_proof',coalesce(v_output->'provider_proof','[]'::jsonb),
      'truth_boundary','Only external provider IDs and public readback count as daily commercial proof.'
    )
  );

  select bool_and(coalesce((value->>'operational')::boolean,false))
    into v_all_operational
  from jsonb_each(v_components);

  v_closed_loop:=jsonb_build_object(
    'operational',v_all_operational,
    'signal',v_signal.signal_key,
    'impact',v_impact->>'impact_key',
    'decision',v_action.action_key,
    'execution',v_action.canonical_action_ref,
    'provider_proof',coalesce(v_output->'provider_proof','[]'::jsonb),
    'outcome_reconciliation',v_outcomes,
    'learning_contract',v_learning->>'contract'
  );

  v_idempotency_key:=v_tenant_id||'|'||p_run_date::text||'|'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24MI');
  insert into public.powerhouse_infinity_cycle_receipts_v1(
    idempotency_key,tenant_id,run_date,state,components,closed_loop,commercial_proof,evidence
  ) values (
    v_idempotency_key,v_tenant_id,p_run_date,
    case when v_all_operational then 'VERIFIED' else 'DEGRADED' end,
    v_components,v_closed_loop,v_output,
    jsonb_build_object(
      'contract','powerhouse-infinity-operating-loop-v1',
      'existing_state_first',true,
      'single_scheduler_owner','powerhouse-runtime-scheduler-mux-v1',
      'source_observed_at',v_signal.observed_at,
      'executed_at',v_now
    )
  ) on conflict(idempotency_key) do nothing;

  select to_jsonb(r) into v_receipt
  from public.powerhouse_infinity_cycle_receipts_v1 r
  where r.idempotency_key=v_idempotency_key;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'powerhouse-infinity:'||v_idempotency_key,
    'powerhouse_infinity_cycle','powerhouse-infinity-operating-loop-v1',v_tenant_id,v_now,
    v_receipt,
    jsonb_build_object('tenant_id',v_tenant_id,'run_date',p_run_date),
    case when v_all_operational then 'actioned' else 'observed' end,
    case when v_all_operational then 'VERIFIED' else 'PARTIAL' end,
    case when v_all_operational then 1 else 0.5 end
  ) on conflict(dedupe_key) do nothing;

  return v_receipt;
end;
$function$;

revoke execute on function public.powerhouse_infinity_operating_loop_v1(text,date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_infinity_operating_loop_v1(text,date)
  to service_role;

create or replace function public.powerhouse_runtime_scheduler_mux_v3(
  p_now timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_base jsonb;
  v_infinity jsonb := '{}'::jsonb;
  v_local timestamp := p_now at time zone 'Europe/Amsterdam';
begin
  v_base:=public.powerhouse_runtime_scheduler_mux_v2(p_now);
  if extract(hour from v_local)::integer=7 and extract(minute from v_local)::integer=41 then
    v_infinity:=public.powerhouse_infinity_operating_loop_v1(null,v_local::date);
  end if;
  return coalesce(v_base,'{}'::jsonb)||jsonb_build_object(
    'powerhouse_infinity',v_infinity,
    'contract','powerhouse-runtime-scheduler-mux-v3'
  );
end;
$function$;

revoke execute on function public.powerhouse_runtime_scheduler_mux_v3(timestamptz)
  from public, anon, authenticated;
grant execute on function public.powerhouse_runtime_scheduler_mux_v3(timestamptz)
  to service_role;

create or replace view public.powerhouse_infinity_status_v1
with (security_invoker=true) as
with latest as (
  select * from public.powerhouse_infinity_cycle_receipts_v1
  order by created_at desc limit 1
)
select
  l.tenant_id,l.run_date,l.created_at,l.state as cycle_state,
  c.key as component,
  coalesce((c.value->>'operational')::boolean,false) as operational,
  c.value as evidence
from latest l
cross join lateral jsonb_each(l.components) c;

revoke all on public.powerhouse_infinity_status_v1 from public, anon, authenticated;
grant select on public.powerhouse_infinity_status_v1 to service_role;

do $do$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-runtime-scheduler-mux-v1') then
    perform cron.unschedule('powerhouse-runtime-scheduler-mux-v1');
  end if;
  perform cron.schedule(
    'powerhouse-runtime-scheduler-mux-v1',
    '1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59 * * * *',
    'select public.powerhouse_runtime_scheduler_mux_v3(now());'
  );
end
$do$;
