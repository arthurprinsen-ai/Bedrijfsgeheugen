begin;

create or replace function public.powerhouse_enrich_outbound_execution_gates_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_catalog'
as $$
declare
  v_updated integer := 0;
  v_gmail_capable boolean := false;
  v_linkedin_capable boolean := false;
  v_email_ready integer := 0;
  v_linkedin_ready integer := 0;
  v_now timestamptz := now();
begin
  select exists(
    select 1 from public.powerhouse_runtime_events e
    where e.event_type='provider_readback_verified'
      and e.source = 'gmail'
      and e.subject_key='gmail-outbound-replies'
      and e.state='observed'
      and e.data_quality='OBSERVED'
      and e.occurred_at >= v_now - interval '26 hours'
  ) into v_gmail_capable;

  select exists(
    select 1 from public.powerhouse_runtime_events e
    where e.event_type='provider_readback_verified'
      and e.source = 'linkedin'
      and e.subject_key='linkedin-outbound'
      and e.state='observed'
      and e.data_quality='OBSERVED'
      and e.occurred_at >= v_now - interval '26 hours'
  ) into v_linkedin_capable;

  with nba as (
    select distinct on (opportunity_key,person_key)
      opportunity_key,person_key,status,email,linkedin_url,person_name,company_key,
      expected_commercial_value_eur,buying_window_confidence,
      action_confidence,best_context,evidence_density,updated_at
    from public.powerhouse_commercial_next_best_action_v2
    where opportunity_key is not null
    order by opportunity_key,person_key,updated_at desc nulls last
  ), enriched as (
    select a.action_id,
      lower(coalesce(a.channel,'')) as channel_norm,
      n.email,n.linkedin_url,n.person_key,n.person_name,n.company_key,
      n.status as opportunity_status,
      n.expected_commercial_value_eur,n.buying_window_confidence,
      n.action_confidence,n.best_context,n.evidence_density,
      not exists(
        select 1 from public.powerhouse_sales_actions p
        where p.action_id<>a.action_id
          and p.person_key is not distinct from coalesce(a.person_key,n.person_key)
          and lower(coalesce(p.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
          and p.status in ('prepared','waiting','queued','approved','scheduled','executed','completed','done')
          and coalesce(p.executed_at,p.updated_at,p.created_at) >= v_now - interval '7 days'
      ) as contact_pressure_ok
    from public.powerhouse_sales_actions a
    left join nba n
      on n.opportunity_key=a.opportunity_key
     and (a.person_key is null or n.person_key=a.person_key)
    where a.status='suggested'
      and lower(coalesce(a.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
  )
  update public.powerhouse_sales_actions a
  set person_key=coalesce(a.person_key,e.person_key),
      evidence = coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'execution_gate', jsonb_build_object(
          'contract','powerhouse-revenue-acceleration-v1',
          'exact_destination_verified', case
            when e.channel_norm in ('e-mail','email') then coalesce(e.email,'') ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
            when e.channel_norm in ('linkedin dm','linkedin_dm') then nullif(btrim(coalesce(e.linkedin_url,'')),'') is not null
            else false end,
          'eligibility_verified', coalesce(e.opportunity_status,'')='open'
             and e.person_key is not null
             and e.company_key is not null
             and coalesce(e.expected_commercial_value_eur,0)>0
             and coalesce(e.buying_window_confidence,0)>=0.20
             and coalesce(e.action_confidence,0)>=0.20,
          'contact_pressure_ok', e.contact_pressure_ok,
          'identity_verified', e.person_key is not null
             and nullif(btrim(coalesce(e.person_name,'')),'') is not null
             and e.company_key is not null,
          'truth_verified', nullif(btrim(coalesce(e.best_context,'')),'') is not null
             and coalesce(e.evidence_density,0)>0,
          'provider_capability_verified', case
            when e.channel_norm in ('e-mail','email') then v_gmail_capable
            when e.channel_norm in ('linkedin dm','linkedin_dm') then v_linkedin_capable
            else false end,
          'destination', case
            when e.channel_norm in ('e-mail','email') and coalesce(e.email,'') ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then e.email
            when e.channel_norm in ('linkedin dm','linkedin_dm') and nullif(btrim(coalesce(e.linkedin_url,'')),'') is not null then e.linkedin_url
            else null end,
          'provider_readback_contract', case
            when e.channel_norm in ('e-mail','email') then 'gmail-outbound-replies'
            when e.channel_norm in ('linkedin dm','linkedin_dm') then 'linkedin-outbound'
            else null end,
          'outbound_daily_limit',5,
          'checked_at',v_now,
          'fail_closed',true
        )
      ),
      updated_at=v_now
  from enriched e
  where a.action_id=e.action_id;
  get diagnostics v_updated=row_count;

  select count(*)::integer into v_email_ready
  from public.powerhouse_sales_actions a
  where a.status='suggested'
    and lower(coalesce(a.channel,'')) in ('e-mail','email')
    and coalesce(a.evidence->'execution_gate'->>'exact_destination_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'eligibility_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'contact_pressure_ok','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'identity_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'truth_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'provider_capability_verified','false')='true';

  select count(*)::integer into v_linkedin_ready
  from public.powerhouse_sales_actions a
  where a.status='suggested'
    and lower(coalesce(a.channel,'')) in ('linkedin dm','linkedin_dm')
    and coalesce(a.evidence->'execution_gate'->>'exact_destination_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'eligibility_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'contact_pressure_ok','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'identity_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'truth_verified','false')='true'
    and coalesce(a.evidence->'execution_gate'->>'provider_capability_verified','false')='true';

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'outbound-gate-enrichment:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'outbound_execution_gates_enriched','powerhouse-revenue-acceleration-v1','powerhouse','sales',v_now,
    jsonb_build_object(
      'updated_actions',v_updated,'gmail_provider_capable',v_gmail_capable,
      'linkedin_provider_capable',v_linkedin_capable,'email_gate_ready',v_email_ready,
      'linkedin_gate_ready',v_linkedin_ready,'outbound_daily_limit',5
    ),
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'fail_closed',true),
    'observed','OBSERVED',1,v_now
  ) on conflict(dedupe_key) do update
    set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
        state=excluded.state,data_quality=excluded.data_quality,updated_at=v_now;

  return jsonb_build_object(
    'contract','powerhouse-revenue-acceleration-v1',
    'updated_actions',v_updated,
    'gmail_provider_capable',v_gmail_capable,
    'linkedin_provider_capable',v_linkedin_capable,
    'email_gate_ready',v_email_ready,
    'linkedin_gate_ready',v_linkedin_ready,
    'outbound_daily_limit',5
  );
end;
$$;

create or replace function public.powerhouse_promote_commercial_learnings_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_catalog'
as $$
declare
  v_revenue integer := 0;
  v_social integer := 0;
  v_sales integer := 0;
  v_now timestamptz := now();
begin
  with candidates as (
    select learning_id,status as old_status,
      case
        when sample_size >= 10 and confidence >= 0.70
          and nullif(btrim(coalesce(baseline_definition,'')),'') is not null
          and coalesce(effect_size,0)<0 then 'REJECTED'
        when sample_size >= 5 and confidence >= 0.70
          and nullif(btrim(coalesce(baseline_definition,'')),'') is not null
          and coalesce(effect_size,0)>0 then 'PROVEN'
        when sample_size >= 5
          and nullif(btrim(coalesce(baseline_definition,'')),'') is not null
          and (confidence<0.70 or coalesce(effect_size,0)=0 or (expires_or_review_at is not null and expires_or_review_at<v_now)) then 'WEAKENING'
        else status
      end as new_status
    from public.revenue_learnings
    where tenant_id='canonical'
  ), changed as (
    update public.revenue_learnings l
    set status=c.new_status,last_validated_at=v_now,updated_at=v_now
    from candidates c
    where l.tenant_id='canonical' and l.learning_id=c.learning_id
      and c.new_status is distinct from c.old_status
    returning l.learning_id,c.old_status,c.new_status,l.sample_size,l.confidence
  ), events as (
    insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
    )
    select 'commercial-learning-status:revenue:'||learning_id||':'||new_status,
      'commercial_learning_status_changed','powerhouse-revenue-acceleration-v1',learning_id,'system',v_now,
      jsonb_build_object('store','revenue_learnings','old_status',old_status,'new_status',new_status,'sample_size',sample_size,'confidence',confidence),
      jsonb_build_object('baseline_required',true,'contract','powerhouse-revenue-acceleration-v1'),
      'observed','OBSERVED',1,v_now
    from changed
    on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,updated_at=v_now
    returning 1
  ) select count(*)::integer into v_revenue from events;

  with candidates as (
    select learning_id,status as old_status,
      case
        when sample_size >= 10 and confidence >= 0.70
          and nullif(btrim(coalesce(baseline_definition,'')),'') is not null
          and coalesce(effect_size,0)<0 then 'REJECTED'
        when sample_size >= 5 and confidence >= 0.70
          and nullif(btrim(coalesce(baseline_definition,'')),'') is not null
          and coalesce(effect_size,0)>0 then 'PROVEN'
        when sample_size >= 5
          and nullif(btrim(coalesce(baseline_definition,'')),'') is not null
          and (confidence<0.70 or coalesce(effect_size,0)=0 or (expires_or_review_at is not null and expires_or_review_at<v_now)) then 'WEAKENING'
        else status
      end as new_status
    from public.social_learnings
    where tenant_id='canonical'
  ), changed as (
    update public.social_learnings l
    set status=c.new_status,last_validated_at=v_now,updated_at=v_now
    from candidates c
    where l.tenant_id='canonical' and l.learning_id=c.learning_id
      and c.new_status is distinct from c.old_status
    returning l.learning_id,c.old_status,c.new_status,l.sample_size,l.confidence
  ), events as (
    insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
    )
    select 'commercial-learning-status:social:'||learning_id||':'||new_status,
      'commercial_learning_status_changed','powerhouse-revenue-acceleration-v1',learning_id,'system',v_now,
      jsonb_build_object('store','social_learnings','old_status',old_status,'new_status',new_status,'sample_size',sample_size,'confidence',confidence),
      jsonb_build_object('baseline_required',true,'contract','powerhouse-revenue-acceleration-v1'),
      'observed','OBSERVED',1,v_now
    from changed
    on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,updated_at=v_now
    returning 1
  ) select count(*)::integer into v_social from events;

  with candidates as (
    select learning_id,status as old_status,
      case
        when sample_size >= 10 and confidence<0.25 then 'rejected'
        when sample_size >= 5 and confidence >= 0.70 and (
          coalesce((evidence->>'outcomes_90d')::numeric,0)>0
          or coalesce((evidence->>'observed_revenue_eur_90d')::numeric,0)>0
          or coalesce((evidence->'maturity'->>'outcome_count')::numeric,0)>0
        ) then 'proven'
        when sample_size >= 5 and (confidence<0.50 or (expires_at is not null and expires_at<v_now)) then 'weakening'
        else status
      end as new_status
    from public.powerhouse_sales_learnings
  ), changed as (
    update public.powerhouse_sales_learnings l
    set status=c.new_status,updated_at=v_now
    from candidates c
    where l.learning_id=c.learning_id and c.new_status is distinct from c.old_status
    returning l.learning_id,c.old_status,c.new_status,l.sample_size,l.confidence
  ), events as (
    insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
    )
    select 'commercial-learning-status:sales:'||learning_id::text||':'||new_status,
      'commercial_learning_status_changed','powerhouse-revenue-acceleration-v1',learning_id::text,'system',v_now,
      jsonb_build_object('store','powerhouse_sales_learnings','old_status',old_status,'new_status',new_status,'sample_size',sample_size,'confidence',confidence),
      jsonb_build_object('baseline_not_invented',true,'observed_outcome_required_for_promotion',true,'contract','powerhouse-revenue-acceleration-v1'),
      'observed','OBSERVED',1,v_now
    from changed
    on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,updated_at=v_now
    returning 1
  ) select count(*)::integer into v_sales from events;

  return jsonb_build_object(
    'contract','powerhouse-revenue-acceleration-v1',
    'revenue_learnings_changed',v_revenue,'social_learnings_changed',v_social,'sales_learnings_changed',v_sales,
    'promotion_rule','sample_size >= 5; confidence >= 0.70; baseline_definition required where present; observed commercial outcome required for sales learning promotion',
    'truth_boundary','No baseline, outcome or realized revenue is fabricated.'
  );
end;
$$;

create or replace function public.powerhouse_revenue_acceleration_cycle_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_catalog'
as $$
declare
  v_now timestamptz := now();
  v_learning jsonb;
  v_gates jsonb;
  v_prepare jsonb;
  v_promote jsonb;
  v_full_cycle jsonb := '{}'::jsonb;
  v_flywheel jsonb := '{}'::jsonb;
  v_maturity jsonb := '{}'::jsonb;
  v_strategy jsonb := '[]'::jsonb;
  v_prepared_external integer := 0;
  v_bad_prepared integer := 0;
  v_linkedin_blocked integer := 0;
  v_pending_outcome_obligations integer := 0;
  v_healthy boolean := false;
  v_result jsonb;
begin
  v_learning := public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  v_gates := public.powerhouse_enrich_outbound_execution_gates_v1(p_run_date);
  v_prepare := public.powerhouse_prepare_safe_actions_v1(p_run_date);
  v_promote := public.powerhouse_promote_commercial_learnings_v1(p_run_date);

  select coalesce(evidence,'{}'::jsonb) into v_full_cycle
  from public.powerhouse_runtime_events
  where event_type='full_cycle_production_proof'
  order by occurred_at desc limit 1;

  select to_jsonb(f) into v_flywheel from public.powerhouse_revenue_flywheel_v1 f limit 1;
  select to_jsonb(m) into v_maturity from public.powerhouse_commercial_maturity_v1 m limit 1;
  select coalesce(jsonb_agg(to_jsonb(s) order by s.strategy_performance desc),'[]'::jsonb)
    into v_strategy from public.powerhouse_sales_strategy_performance_v1 s;

  select count(*) filter (where status='prepared' and lower(coalesce(channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')),
         count(*) filter (where status='prepared' and lower(coalesce(channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm') and not (
           coalesce(evidence->'execution_gate'->>'exact_destination_verified','false')='true' and
           coalesce(evidence->'execution_gate'->>'eligibility_verified','false')='true' and
           coalesce(evidence->'execution_gate'->>'contact_pressure_ok','false')='true' and
           coalesce(evidence->'execution_gate'->>'identity_verified','false')='true' and
           coalesce(evidence->'execution_gate'->>'truth_verified','false')='true' and
           coalesce(evidence->'execution_gate'->>'provider_capability_verified','false')='true')),
         count(*) filter (where status='suggested' and lower(coalesce(channel,'')) in ('linkedin dm','linkedin_dm') and coalesce(evidence->'execution_gate'->>'provider_capability_verified','false')<>'true')
  into v_prepared_external,v_bad_prepared,v_linkedin_blocked
  from public.powerhouse_sales_actions;

  select count(*)::integer into v_pending_outcome_obligations
  from public.powerhouse_runtime_events
  where event_type='outcome_readback_required' and state='decided'
    and occurred_at>=v_now-interval '30 days';

  v_healthy := coalesce((v_learning->>'healthy')::boolean,false)
    and coalesce((v_full_cycle->>'healthy')::boolean,false)
    and v_bad_prepared=0
    and coalesce((v_flywheel->>'due_uncalibrated_forecasts')::integer,0)=0
    and coalesce((v_prepare->>'external_actions_prepared')::integer,0)<=5;

  v_result := jsonb_build_object(
    'contract','powerhouse-revenue-acceleration-v1','run_date',p_run_date,'executed_at',v_now,'healthy',v_healthy,
    'commercial_learning',v_learning,'gate_enrichment',v_gates,'safe_preparation',v_prepare,'learning_promotion',v_promote,
    'full_cycle_production_proof',v_full_cycle,'flywheel',v_flywheel,'maturity',v_maturity,
    'sales_strategy_performance',v_strategy,
    'external_prepared_actions',v_prepared_external,'prepared_actions_missing_hard_gates',v_bad_prepared,
    'linkedin_actions_fail_closed_on_provider',v_linkedin_blocked,
    'pending_outcome_obligations_30d',v_pending_outcome_obligations,
    'outbound_daily_limit',5,
    'objective','increase realized revenue by converting evidence-backed opportunities into safely prepared actions and feeding observed outcomes back into canonical learning',
    'truth_boundary','realized revenue only comes from observed powerhouse_sales_outcomes; modeled value is never promoted to realized revenue'
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'revenue-acceleration:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'revenue_acceleration_cycle','powerhouse-revenue-acceleration-v1','powerhouse','sales',v_now,v_result,
    jsonb_build_object('closed_loop',true,'outbound_daily_limit',5,'fail_closed',true,'no_parallel_system',true),
    case when v_healthy then 'actioned' else 'error' end,
    case when v_healthy then 'OBSERVED' else 'DEGRADED' end,1,v_now
  ) on conflict(dedupe_key) do update
    set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
        state=excluded.state,data_quality=excluded.data_quality,updated_at=v_now;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(v_now,'powerhouse-revenue-acceleration-v1','commercial_closed_loop',case when v_healthy then 'ok' else 'fout' end,
    case when v_healthy then 'Revenue acceleration cycle healthy and all prepared external actions satisfy hard gates.' else 'Revenue acceleration remains fail-closed because one or more canonical health/gate/calibration conditions are not green.' end,
    v_result);

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,expires_at
  ) values(
    'learning:revenue-acceleration-gate-materialization-v1','powerhouse','growth_revenue_os',
    'Commercial suggestions must materialize exact execution-gate evidence before the safe executor can convert them into provider-ready actions.',
    jsonb_build_object(
      'incident','suggested outbound actions existed without materialized execution_gate evidence',
      'root_cause','canonical person/company/provider evidence was not written into the six hard execution gates',
      'prevention','hourly gate enrichment runs before safe preparation and provider capability remains evidence-bound',
      'contract','powerhouse-revenue-acceleration-v1'
    ),
    jsonb_build_object('expected_effect','more eligible actions become safely executable while unsupported providers remain fail-closed'),
    0.95,'active',1,v_now+interval '90 days'
  ) on conflict(fingerprint) do update
    set evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,
        expires_at=excluded.expires_at,updated_at=v_now;

  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'revenue-acceleration-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'revenue_acceleration_cycle_failed','powerhouse-revenue-acceleration-v1','powerhouse',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate),jsonb_build_object('fail_closed',true),
    'error','DEGRADED',1,now()
  ) on conflict(dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-revenue-acceleration-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;

revoke execute on function public.powerhouse_enrich_outbound_execution_gates_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_promote_commercial_learnings_v1(date) from public, anon, authenticated;
revoke execute on function public.powerhouse_revenue_acceleration_cycle_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_enrich_outbound_execution_gates_v1(date) to service_role;
grant execute on function public.powerhouse_promote_commercial_learnings_v1(date) to service_role;
grant execute on function public.powerhouse_revenue_acceleration_cycle_v1(date) to service_role;

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-revenue-acceleration-v1' limit 1;
  if v_jobid is null then
    perform cron.schedule('powerhouse-revenue-acceleration-v1','32 * * * *',$cron$select public.powerhouse_revenue_acceleration_cycle_v1();$cron$);
  else
    perform cron.alter_job(v_jobid,'32 * * * *','select public.powerhouse_revenue_acceleration_cycle_v1();',null,null,true);
  end if;
end $$;

commit;
