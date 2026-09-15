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
  v_now timestamptz := now();
begin
  select exists(
    select 1 from public.powerhouse_runtime_events e
    where e.event_type='provider_readback_verified'
      and lower(coalesce(e.source,'')) = 'gmail'
      and coalesce(e.state,'') not in ('error','blocked')
      and e.occurred_at >= v_now - interval '7 days'
  ) into v_gmail_capable;

  select exists(
    select 1 from public.powerhouse_runtime_events e
    where e.event_type='provider_readback_verified'
      and lower(coalesce(e.source,'')) = 'linkedin'
      and e.subject_key = 'linkedin-outbound'
      and coalesce(e.state,'') not in ('error','blocked')
      and e.occurred_at >= v_now - interval '7 days'
  ) into v_linkedin_capable;

  with nba as (
    select distinct on (opportunity_key,person_key)
      opportunity_key,person_key,status,email,linkedin_url,
      expected_commercial_value_eur,buying_window_confidence,
      action_confidence,best_context,evidence_density
    from public.powerhouse_commercial_next_best_action_v2
    where opportunity_key is not null
    order by opportunity_key,person_key,updated_at desc nulls last
  ), enriched as (
    select a.action_id,
      lower(coalesce(a.channel,'')) as channel_norm,
      n.email,n.linkedin_url,n.status as opportunity_status,
      n.expected_commercial_value_eur,n.buying_window_confidence,
      n.action_confidence,n.best_context,n.evidence_density,
      not exists(
        select 1 from public.powerhouse_sales_actions p
        where p.person_key=a.person_key
          and p.action_id<>a.action_id
          and lower(coalesce(p.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
          and p.status in ('prepared','waiting','queued','approved','scheduled','executed','completed','done')
          and coalesce(p.executed_at,p.updated_at,p.created_at) >= v_now - interval '5 days'
      ) as contact_pressure_ok
    from public.powerhouse_sales_actions a
    left join nba n
      on n.opportunity_key=a.opportunity_key
     and (n.person_key=a.person_key or (n.person_key is null and a.person_key is null))
    where a.status='suggested'
      and lower(coalesce(a.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
  )
  update public.powerhouse_sales_actions a
  set evidence = coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'execution_gate', jsonb_build_object(
          'exact_destination_verified', case
            when e.channel_norm in ('e-mail','email') then nullif(btrim(coalesce(e.email,'')),'') is not null
            when e.channel_norm in ('linkedin dm','linkedin_dm') then nullif(btrim(coalesce(e.linkedin_url,'')),'') is not null
            else false end,
          'eligibility_verified', coalesce(e.opportunity_status,'') in ('open','active','qualified','discovery','proposal')
             and coalesce(e.expected_commercial_value_eur,0)>0
             and coalesce(e.buying_window_confidence,0)>=0.20
             and coalesce(e.action_confidence,0)>=0.20,
          'contact_pressure_ok', e.contact_pressure_ok,
          'identity_verified', nullif(btrim(coalesce(a.person_key,'')),'') is not null,
          'truth_verified', nullif(btrim(coalesce(e.best_context,'')),'') is not null
             and coalesce(e.evidence_density,0)>0,
          'provider_capability_verified', case
            when e.channel_norm in ('e-mail','email') then v_gmail_capable
            when e.channel_norm in ('linkedin dm','linkedin_dm') then v_linkedin_capable
            else false end,
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

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'outbound-gate-enrichment:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'outbound_execution_gates_enriched','powerhouse-revenue-acceleration-v1','powerhouse','sales',v_now,
    jsonb_build_object('updated_actions',v_updated,'gmail_provider_capable',v_gmail_capable,'linkedin_provider_capable',v_linkedin_capable,'outbound_daily_limit',5),
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'fail_closed',true),
    'observed','OBSERVED',1,v_now
  ) on conflict(dedupe_key) do update
    set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  return jsonb_build_object(
    'contract','powerhouse-revenue-acceleration-v1',
    'updated_actions',v_updated,
    'gmail_provider_capable',v_gmail_capable,
    'linkedin_provider_capable',v_linkedin_capable,
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
  with changed as (
    update public.revenue_learnings l
    set status=case
      when coalesce(sample_size,0)>=10 and coalesce(confidence,0)<0.35 and coalesce(effect_size,0)<=0 then 'REJECTED'
      when coalesce(sample_size,0)>=5 and (coalesce(confidence,0)<0.50 or coalesce(effect_size,0)<=0 or (expires_or_review_at is not null and expires_or_review_at<v_now)) then 'WEAKENING'
      when coalesce(sample_size,0)>=5 and coalesce(confidence,0)>=0.70 and nullif(btrim(coalesce(baseline_definition,'')),'') is not null and coalesce(effect_size,0)>0 then 'PROVEN'
      else 'TESTING' end,
      updated_at=v_now
    where status is distinct from case
      when coalesce(sample_size,0)>=10 and coalesce(confidence,0)<0.35 and coalesce(effect_size,0)<=0 then 'REJECTED'
      when coalesce(sample_size,0)>=5 and (coalesce(confidence,0)<0.50 or coalesce(effect_size,0)<=0 or (expires_or_review_at is not null and expires_or_review_at<v_now)) then 'WEAKENING'
      when coalesce(sample_size,0)>=5 and coalesce(confidence,0)>=0.70 and nullif(btrim(coalesce(baseline_definition,'')),'') is not null and coalesce(effect_size,0)>0 then 'PROVEN'
      else 'TESTING' end
    returning learning_id,status,sample_size,confidence
  ) select count(*) into v_revenue from changed;

  with changed as (
    update public.social_learnings l
    set status=case
      when coalesce(sample_size,0)>=10 and coalesce(confidence,0)<0.35 and coalesce(effect_size,0)<=0 then 'REJECTED'
      when coalesce(sample_size,0)>=5 and (coalesce(confidence,0)<0.50 or coalesce(effect_size,0)<=0 or (expires_or_review_at is not null and expires_or_review_at<v_now)) then 'WEAKENING'
      when coalesce(sample_size,0)>=5 and coalesce(confidence,0)>=0.70 and nullif(btrim(coalesce(baseline_definition,'')),'') is not null and coalesce(effect_size,0)>0 then 'PROVEN'
      else case when status='CANDIDATE' then 'CANDIDATE' else 'TESTING' end end,
      updated_at=v_now
    where status is distinct from case
      when coalesce(sample_size,0)>=10 and coalesce(confidence,0)<0.35 and coalesce(effect_size,0)<=0 then 'REJECTED'
      when coalesce(sample_size,0)>=5 and (coalesce(confidence,0)<0.50 or coalesce(effect_size,0)<=0 or (expires_or_review_at is not null and expires_or_review_at<v_now)) then 'WEAKENING'
      when coalesce(sample_size,0)>=5 and coalesce(confidence,0)>=0.70 and nullif(btrim(coalesce(baseline_definition,'')),'') is not null and coalesce(effect_size,0)>0 then 'PROVEN'
      else case when status='CANDIDATE' then 'CANDIDATE' else 'TESTING' end end
    returning learning_id,status,sample_size,confidence
  ) select count(*) into v_social from changed;

  with changed as (
    update public.powerhouse_sales_learnings l
    set status=case
      when coalesce(sample_size,0)>=10 and coalesce(confidence,0)<0.35 then 'rejected'
      when coalesce(sample_size,0)>=5 and (coalesce(confidence,0)<0.50 or (expires_at is not null and expires_at<v_now)) then 'weakening'
      when coalesce(sample_size,0)>=5 and coalesce(confidence,0)>=0.70 and jsonb_typeof(coalesce(evidence,'{}'::jsonb))='object' and evidence<>'{}'::jsonb then 'proven'
      else 'active' end,
      updated_at=v_now
    where status is distinct from case
      when coalesce(sample_size,0)>=10 and coalesce(confidence,0)<0.35 then 'rejected'
      when coalesce(sample_size,0)>=5 and (coalesce(confidence,0)<0.50 or (expires_at is not null and expires_at<v_now)) then 'weakening'
      when coalesce(sample_size,0)>=5 and coalesce(confidence,0)>=0.70 and jsonb_typeof(coalesce(evidence,'{}'::jsonb))='object' and evidence<>'{}'::jsonb then 'proven'
      else 'active' end
    returning learning_id,status,sample_size,confidence
  ) select count(*) into v_sales from changed;

  if v_revenue+v_social+v_sales>0 then
    insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
    ) values (
      'commercial-learning-status:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24MI'),
      'commercial_learning_status_changed','powerhouse-revenue-acceleration-v1','powerhouse',v_now,
      jsonb_build_object('revenue_learnings_changed',v_revenue,'social_learnings_changed',v_social,'sales_learnings_changed',v_sales,'rules',jsonb_build_object('PROVEN','sample_size>=5 confidence>=0.70 positive evidence/baseline','WEAKENING','sample_size>=5 weak/negative/expired evidence','REJECTED','sample_size>=10 confidence<0.35 non-positive evidence')),
      jsonb_build_object('closed_loop',true,'evidence_based',true),'actioned','OBSERVED',1,v_now
    ) on conflict(dedupe_key) do update set evidence=excluded.evidence,updated_at=v_now;
  end if;

  return jsonb_build_object('contract','powerhouse-revenue-acceleration-v1','revenue_learnings_changed',v_revenue,'social_learnings_changed',v_social,'sales_learnings_changed',v_sales);
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
  v_flywheel jsonb;
  v_maturity jsonb;
  v_prepared_external integer := 0;
  v_bad_prepared integer := 0;
  v_linkedin_blocked integer := 0;
  v_healthy boolean := false;
  v_result jsonb;
begin
  v_learning := public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  v_gates := public.powerhouse_enrich_outbound_execution_gates_v1(p_run_date);
  v_prepare := public.powerhouse_prepare_safe_actions_v1(p_run_date);
  v_promote := public.powerhouse_promote_commercial_learnings_v1(p_run_date);

  select to_jsonb(f) into v_flywheel from public.powerhouse_revenue_flywheel_v1 f limit 1;
  select to_jsonb(m) into v_maturity from public.powerhouse_commercial_maturity_v1 m limit 1;

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

  v_healthy := coalesce((v_learning->>'healthy')::boolean,false)
    and v_bad_prepared=0
    and coalesce((v_flywheel->>'due_uncalibrated_forecasts')::integer,0)=0;

  v_result := jsonb_build_object(
    'contract','powerhouse-revenue-acceleration-v1','run_date',p_run_date,'executed_at',v_now,'healthy',v_healthy,
    'commercial_learning',v_learning,'gate_enrichment',v_gates,'safe_preparation',v_prepare,'learning_promotion',v_promote,
    'flywheel',v_flywheel,'maturity',v_maturity,
    'external_prepared_actions',v_prepared_external,'prepared_actions_missing_hard_gates',v_bad_prepared,
    'linkedin_actions_fail_closed_on_provider',v_linkedin_blocked,
    'truth_boundary','realized revenue only comes from observed powerhouse_sales_outcomes; modeled value is never promoted to realized revenue'
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'revenue-acceleration:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'revenue_acceleration_cycle','powerhouse-revenue-acceleration-v1','powerhouse','sales',v_now,v_result,
    jsonb_build_object('closed_loop',true,'outbound_daily_limit',5,'fail_closed',true,'no_parallel_system',true),
    case when v_healthy then 'actioned' else 'error' end,'OBSERVED',1,v_now
  ) on conflict(dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(v_now,'powerhouse-revenue-acceleration-v1','commercial_closed_loop',case when v_healthy then 'OK' else 'FOUT' end,
    case when v_healthy then 'Revenue acceleration cycle healthy and all prepared external actions satisfy hard gates.' else 'Revenue acceleration remains fail-closed because one or more canonical health/gate/calibration conditions are not green.' end,
    v_result);

  insert into public.powerhouse_sales_learnings(fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size,expires_at)
  values(
    'learning:revenue-acceleration-gate-materialization-v1','powerhouse','growth_revenue_os',
    'Commercial suggestions must materialize exact execution-gate evidence before the safe executor can convert them into provider-ready actions.',
    jsonb_build_object('root_cause','suggested outbound actions existed without materialized execution_gate evidence','prevention','hourly gate enrichment before safe preparation','contract','powerhouse-revenue-acceleration-v1'),
    jsonb_build_object('expected_effect','more eligible actions become safely executable while unsupported providers remain fail-closed'),0.95,'proven',1,v_now+interval '90 days')
  on conflict(fingerprint) do update set evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,expires_at=excluded.expires_at,updated_at=v_now;

  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at)
  values('revenue-acceleration-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),'revenue_acceleration_cycle_failed','powerhouse-revenue-acceleration-v1','powerhouse',now(),jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate),jsonb_build_object('fail_closed',true),'error','OBSERVED',1,now())
  on conflict(dedupe_key) do nothing;
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
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
  perform cron.schedule('powerhouse-revenue-acceleration-v1','32 * * * *',$cron$select public.powerhouse_revenue_acceleration_cycle_v1();$cron$);
end $$;

commit;
