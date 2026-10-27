-- Repair Action Fabric digest resolution and fail closed until canonical materialization exists.

create or replace function public.powerhouse_materialize_intelligence_action_v1(
  p_tenant_id text,
  p_action_key text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  a public.powerhouse_intelligence_action_candidate_v1%rowtype;
  o public.brain_obligations%rowtype;
  v_payload text;
  v_hash text;
begin
  if nullif(btrim(p_tenant_id),'') is null or p_tenant_id='canonical' then
    raise exception 'TENANT_ACTION_REQUIRED';
  end if;

  select * into a
  from public.powerhouse_intelligence_action_candidate_v1
  where tenant_id=p_tenant_id and action_key=p_action_key
  for update;

  if not found then raise exception 'INTELLIGENCE_ACTION_NOT_FOUND:%',p_action_key; end if;
  if a.status='MATERIALIZED' and nullif(a.canonical_action_ref,'') is not null then
    return jsonb_build_object('action_key',a.action_key,'canonical_action_ref',a.canonical_action_ref,'status',a.status,'replayed',true);
  end if;
  if a.status<>'READY' then raise exception 'INTELLIGENCE_ACTION_NOT_READY:%',a.status; end if;
  if not exists (
    select 1 from public.powerhouse_intelligence_company_impact_v1 i
    where i.tenant_id=a.tenant_id
      and i.signal_key=a.signal_key
      and i.impact_key=a.impact_key
      and i.status='SCORED'
      and i.impact_score is not null
  ) then
    raise exception 'INTELLIGENCE_COMPANY_IMPACT_NOT_SCORED';
  end if;

  v_payload:=jsonb_build_object(
    'tenant_id',a.tenant_id,
    'action_key',a.action_key,
    'signal_key',a.signal_key,
    'impact_key',a.impact_key,
    'domain_key',a.domain_key,
    'action_type',a.action_type,
    'priority_score',a.priority_score,
    'due_at',a.due_at,
    'expected_value_eur',a.expected_value_eur,
    'estimated_loss_avoided_eur',a.estimated_loss_avoided_eur
  )::text;
  v_hash:=encode(extensions.digest(convert_to(v_payload,'UTF8'),'sha256'),'hex');

  o:=public.brain_create_obligation(
    'INTELLIGENCE_ACTION_REVIEW',
    'powerhouse-source-universe-impact-engine-v1',
    a.tenant_id||':'||a.action_key,
    coalesce(a.due_at::date,current_date)::text,
    'Europe/Amsterdam',
    v_hash,
    a.action_key,
    coalesce(nullif(a.owner_hint,''),'ONE BRAIN')
  );

  update public.powerhouse_intelligence_action_candidate_v1
  set canonical_action_ref='brain_obligation:'||o.id::text,
      status='MATERIALIZED',
      evidence=evidence||jsonb_build_object(
        'canonical_obligation_id',o.id,
        'canonical_obligation_state',o.state,
        'materialized_at',now(),
        'execution_truth','canonical obligation created; no provider side effect implied'
      ),
      updated_at=now()
  where tenant_id=p_tenant_id and action_key=p_action_key;

  return jsonb_build_object(
    'tenant_id',p_tenant_id,
    'action_key',p_action_key,
    'canonical_action_ref','brain_obligation:'||o.id::text,
    'obligation_state',o.state,
    'status','MATERIALIZED'
  );
end
$function$;

revoke execute on function public.powerhouse_materialize_intelligence_action_v1(text,text)
  from public, anon, authenticated;
grant execute on function public.powerhouse_materialize_intelligence_action_v1(text,text)
  to service_role;

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
      'operational',v_action.status in ('MATERIALIZED','DONE') and nullif(v_action.canonical_action_ref,'') is not null,
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
