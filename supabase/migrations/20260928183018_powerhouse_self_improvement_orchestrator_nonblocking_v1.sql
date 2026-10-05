-- Powerhouse Self-Improvement Layer v1 non-blocking orchestrator
-- Runtime proof showed the first composition synchronously invoked the heavier Company Intelligence cycle.
-- The daily self-improvement observation must consume current canonical projections instead of duplicating orchestration.

create or replace function public.powerhouse_run_self_improvement_layer_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_control jsonb;
  v_company_snapshot jsonb;
  v_result jsonb;
begin
  select to_jsonb(s) into v_control
  from public.powerhouse_self_improvement_control_v1 s;

  select jsonb_build_object(
    'companies',(select count(*) from public.powerhouse_compound_intelligence_v1),
    'learning_companies',(select count(*) from public.powerhouse_compound_intelligence_v1 where verified_outcomes>0),
    'verified_outcomes',(select coalesce(sum(verified_outcomes),0) from public.powerhouse_compound_intelligence_v1),
    'graph_nodes',(select count(*) from public.powerhouse_company_graph_nodes_v1),
    'graph_edges',(select count(*) from public.powerhouse_company_graph_edges_v1),
    'truth','read_current_canonical_projections_no_duplicate_company_cycle'
  ) into v_company_snapshot;

  v_result := jsonb_build_object(
    'contract','powerhouse-self-improvement-layer.v1',
    'run_date',p_run_date,
    'company_intelligence_snapshot',coalesce(v_company_snapshot,'{}'::jsonb),
    'self_improvement_control',coalesce(v_control,'{}'::jsonb),
    'company_intelligence_authority','public.powerhouse_run_company_intelligence_os_v1(date)',
    'autonomous_improvement_authority','public.powerhouse_autonomous_improvement_cron_v1()',
    'protected_delivery_reused',true,
    'duplicate_orchestration',false,
    'uncontrolled_self_modification',false,
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'self-improvement-layer:'||p_run_date::text,
    'self_improvement_cycle','powerhouse-self-improvement-layer.v1','powerhouse-self-improvement',
    now(),v_result,
    jsonb_build_object(
      'no_parallel_learning_store',true,
      'protected_delivery_reused',true,
      'duplicate_orchestration',false,
      'uncontrolled_self_modification',false
    ),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    updated_at=now();

  return v_result;
end;
$$;

revoke execute on function public.powerhouse_run_self_improvement_layer_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_run_self_improvement_layer_v1(date) to service_role;

comment on function public.powerhouse_run_self_improvement_layer_v1(date) is
'Non-blocking daily self-improvement observer. Reads current canonical Company Intelligence projections and the self-improvement control plane; Company Intelligence and autonomous-improvement remain independently scheduled authorities.';
