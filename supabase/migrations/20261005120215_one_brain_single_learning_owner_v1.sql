create or replace function public.powerhouse_commercial_closed_loop_v6(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
) returns jsonb
language plpgsql security definer
set search_path to 'public','pg_catalog'
as $function$
declare
 v_core jsonb; v_fabric jsonb; v_depth jsonb; v_prov jsonb; v_one jsonb; v_status jsonb;
 v_compound jsonb; v_learning_at timestamptz;
begin
 v_one:=public.powerhouse_one_brain_completeness_assurance_v1();
 v_fabric:=public.powerhouse_intelligence_fabric_assurance_v1();
 v_depth:=public.powerhouse_sales_intelligence_depth_assurance_v1();
 v_prov:=public.powerhouse_sales_provenance_assurance_v1();

 -- Single-owner rule: job powerhouse-daily-compound-learning-v1 is the only scheduled producer.
 -- Commercial loop consumes its canonical materialized runtime evidence and never re-runs it.
 select e.evidence, e.occurred_at into v_compound, v_learning_at
 from public.powerhouse_runtime_events e
 where e.event_type='daily_compound_learning_cycle'
   and e.source='powerhouse-daily-compound-learning-v1'
   and e.subject_key='company-intelligence'
 order by e.occurred_at desc limit 1;

 v_core:=public.powerhouse_sales_machine_core_v1(p_run_date);
 v_status:=public.powerhouse_linkedin_sales_machine_status_v1(p_run_date);

 return jsonb_build_object(
  'contract','powerhouse-commercial-closed-loop-v6','run_date',p_run_date,
  'healthy',coalesce((v_one->>'healthy')::boolean,false)
    and coalesce((v_fabric->>'healthy')::boolean,false)
    and coalesce((v_depth->>'healthy')::boolean,false)
    and coalesce((v_prov->>'healthy')::boolean,false)
    and coalesce((v_core->>'healthy')::boolean,false)
    and v_compound is not null,
  'one_brain',v_one,'intelligence_fabric',v_fabric,'intelligence_depth',v_depth,
  'provenance',v_prov,'compound_learning',coalesce(v_compound,'{}'::jsonb),
  'compound_learning_observed_at',v_learning_at,
  'compound_learning_owner','powerhouse-daily-compound-learning-v1',
  'duplicate_learning_run_forbidden',true,
  'sales_machine_core',v_core,'linkedin_salesrobot',v_status,
  'architecture','customer-market-intelligence-brain <-> canonical-heart <-> commercial-decision-brain',
  'lineage','observe->understand->predict->value/problem->strategy/play/psychology->message/quality->nba/channel->provider->outcome/revenue->attribution->calibration/learning->next decision',
  'external_send_executed_by_this_cycle',false,'executed_at',now()
 );
end $function$;
