create or replace view public.powerhouse_gap_register_v1
with (security_invoker = true) as
with executed_without_outcome as (
  select
    'outcome:'||a.action_id::text as gap_key,
    'OUTCOME_READBACK'::text as gap_type,
    case
      when now() >= a.executed_at + interval '30 days' then 100
      when now() >= a.executed_at + interval '7 days' then 90
      when now() >= a.executed_at + interval '24 hours' then 80
      when now() >= a.executed_at + interval '1 hour' then 70
      else 50
    end::numeric as priority,
    a.subject_key,
    a.action_id,
    a.opportunity_key,
    case
      when now() >= a.executed_at + interval '30 days' then 'T+30d'
      when now() >= a.executed_at + interval '7 days' then 'T+7d'
      when now() >= a.executed_at + interval '24 hours' then 'T+24h'
      when now() >= a.executed_at + interval '1 hour' then 'T+1h'
      else 'T+<1h'
    end as repair_route,
    'Executed action has no observed outcome yet; provider/readback evidence is required.'::text as detail,
    jsonb_build_object(
      'executed_at',a.executed_at,
      'channel',a.channel,
      'action_type',a.action_type,
      'provider_execution',coalesce(a.evidence->'execution','{}'::jsonb)
    ) as evidence
  from public.powerhouse_sales_actions a
  where a.executed_at is not null
    and a.outcome_id is null
    and not exists (
      select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id
    )
), unvalued_opportunity as (
  select
    'research:'||o.opportunity_key as gap_key,
    'RESEARCH_ENRICHMENT'::text as gap_type,
    45::numeric as priority,
    o.subject_key,
    null::uuid as action_id,
    o.opportunity_key,
    'existing_sales_action'::text as repair_route,
    'Open opportunity lacks sufficient evidence for a non-zero economic value; enrich evidence instead of inventing value.'::text as detail,
    jsonb_build_object(
      'probability',o.probability,
      'confidence',o.confidence,
      'expected_value_eur',o.expected_value_eur,
      'expected_revenue_value',o.expected_revenue_value,
      'last_evidence_at',o.last_evidence_at,
      'score_components',coalesce(o.score_components,'{}'::jsonb)
    ) as evidence
  from public.powerhouse_opportunities o
  where o.status='open'
    and coalesce(o.expected_value_eur,0)<=0
    and coalesce(o.expected_revenue_value,0)<=0
    and not exists (
      select 1 from public.powerhouse_sales_actions a
      where a.dedupe_key='gap:research:'||o.opportunity_key
    )
), forecast_gap as (
  select
    'forecast:active'::text as gap_key,
    'FORECAST_GENERATION'::text as gap_type,
    85::numeric as priority,
    'powerhouse'::text as subject_key,
    null::uuid as action_id,
    null::text as opportunity_key,
    'powerhouse-predictive-engine'::text as repair_route,
    'No active/claimed forecasts exist; invoke the canonical predictive engine.'::text as detail,
    '{}'::jsonb as evidence
  where not exists (
    select 1 from public.powerhouse_forecasts f where f.status in ('active','claimed')
  )
), calibration_gap as (
  select
    'calibration:'||f.forecast_id::text as gap_key,
    'FORECAST_CALIBRATION'::text as gap_type,
    75::numeric as priority,
    coalesce(f.scope_key,'powerhouse') as subject_key,
    null::uuid as action_id,
    null::text as opportunity_key,
    'powerhouse-forecast-calibrator'::text as repair_route,
    'Forecast horizon has matured without a calibration record.'::text as detail,
    jsonb_build_object(
      'forecast_id',f.forecast_id,
      'horizon_end',f.horizon_end,
      'probability',f.probability,
      'confidence',f.confidence
    ) as evidence
  from public.powerhouse_forecasts f
  where f.horizon_end < (now() at time zone 'Europe/Amsterdam')::date
    and not exists (
      select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=f.forecast_id
    )
), experiment_gap as (
  select
    'experiment:active'::text as gap_key,
    'EXPERIMENT_ACTIVATION'::text as gap_type,
    60::numeric as priority,
    'powerhouse'::text as subject_key,
    null::uuid as action_id,
    null::text as opportunity_key,
    'bg-experimentcyclus'::text as repair_route,
    'No ACTIVE or PLANNED experiment exists; let the canonical experiment engine decide whether evidence/traffic is sufficient.'::text as detail,
    '{}'::jsonb as evidence
  where not exists (
    select 1 from public.social_experiments e
    where e.tenant_id='canonical' and e.status in ('ACTIVE','PLANNED')
  )
)
select * from executed_without_outcome
union all select * from unvalued_opportunity
union all select * from forecast_gap
union all select * from calibration_gap
union all select * from experiment_gap;

create or replace view public.powerhouse_revenue_flywheel_v1
with (security_invoker = true) as
with opp as (
  select
    count(*) filter (where coalesce(status,'') not in ('closed','won','lost'))::int as open_opportunities,
    coalesce(sum(expected_revenue_value) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric as weighted_pipeline_eur,
    coalesce(sum(expected_value_eur*probability) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric as expected_value_eur
  from public.powerhouse_opportunities
), actions as (
  select
    count(*) filter (where status in ('pending','queued','ready','suggested','waiting'))::int as pending_actions,
    count(*) filter (where executed_at is not null)::int as executed_actions,
    count(*) filter (
      where executed_at is not null
        and outcome_id is null
        and not exists (select 1 from public.powerhouse_sales_outcomes so where so.action_id=powerhouse_sales_actions.action_id)
        and not exists (
          select 1 from public.powerhouse_runtime_events e
          where e.dedupe_key like 'gap:outcome-readback:'||powerhouse_sales_actions.action_id::text||':%'
        )
    )::int as executed_without_outcome,
    coalesce(sum(expected_value_eur) filter (where status in ('pending','queued','ready','suggested','waiting')),0)::numeric as pending_action_value_eur,
    count(*) filter (
      where executed_at is not null
        and outcome_id is null
        and not exists (select 1 from public.powerhouse_sales_outcomes so where so.action_id=powerhouse_sales_actions.action_id)
    )::int as pending_external_outcomes
  from public.powerhouse_sales_actions
), outcomes as (
  select
    count(*)::int as outcome_count,
    count(*) filter (where coalesce(revenue_eur,0)>0)::int as revenue_outcomes,
    coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur
  from public.powerhouse_sales_outcomes
), forecasts as (
  select
    count(*)::int as forecast_count,
    count(*) filter (where lower(coalesce(status,'')) in ('active','open','predicted','claimed') or status is null)::int as open_forecasts,
    count(*) filter (
      where horizon_end < (now() at time zone 'Europe/Amsterdam')::date
        and not exists (
          select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=powerhouse_forecasts.forecast_id
        )
    )::int as due_uncalibrated_forecasts
  from public.powerhouse_forecasts
), calibration as (
  select
    count(*)::int as calibration_count,
    coalesce(avg(brier_component),0)::numeric as avg_brier_component,
    coalesce(avg(attribution_confidence),0)::numeric as avg_attribution_confidence
  from public.powerhouse_forecast_calibration
), experiments as (
  select
    count(*) filter (where upper(coalesce(status,'')) in ('ACTIVE','PLANNED'))::int as active_experiments,
    count(*) filter (
      where ended_at is not null
        and besluit is null
        and upper(coalesce(status,'')) in ('COMPLETE','INSUFFICIENT_EVIDENCE')
    )::int as experiments_awaiting_decision
  from public.social_experiments
)
select
  now() as measured_at,
  opp.open_opportunities,
  opp.weighted_pipeline_eur,
  opp.expected_value_eur,
  actions.pending_actions,
  actions.executed_actions,
  actions.executed_without_outcome,
  actions.pending_action_value_eur,
  outcomes.outcome_count,
  outcomes.revenue_outcomes,
  outcomes.realized_revenue_eur,
  forecasts.forecast_count,
  forecasts.open_forecasts,
  calibration.calibration_count,
  calibration.avg_brier_component,
  calibration.avg_attribution_confidence,
  experiments.active_experiments,
  experiments.experiments_awaiting_decision,
  (actions.executed_without_outcome>0) as outcome_gap,
  (forecasts.due_uncalibrated_forecasts>0) as calibration_gap,
  (experiments.experiments_awaiting_decision>0) as experiment_decision_gap,
  actions.pending_external_outcomes,
  forecasts.due_uncalibrated_forecasts
from opp,actions,outcomes,forecasts,calibration,experiments;

create or replace function public.powerhouse_autonomous_gap_closer_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz := now();
  v_cycle jsonb;
  v_outcome_obligations int := 0;
  v_research_actions int := 0;
  v_active_forecasts int := 0;
  v_due_calibrations int := 0;
  v_active_experiments int := 0;
  v_forecast_request bigint := null;
  v_calibration_request bigint := null;
  v_experiment_request bigint := null;
  v_unmanaged_gaps int := 0;
  v_result jsonb;
begin
  v_cycle := public.powerhouse_autonomous_growth_revenue_cycle(p_run_date);

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,channel,
    occurred_at,evidence,context,state,data_quality,confidence,opportunity_key,updated_at
  )
  select
    'gap:outcome-readback:'||a.action_id::text||':'||
      case
        when v_now >= a.executed_at + interval '30 days' then 'T+30d'
        when v_now >= a.executed_at + interval '7 days' then 'T+7d'
        when v_now >= a.executed_at + interval '24 hours' then 'T+24h'
        when v_now >= a.executed_at + interval '1 hour' then 'T+1h'
        else 'T+lt1h'
      end,
    'outcome_readback_required','powerhouse-autonomous-gap-closer-v1',
    coalesce(a.subject_key,a.opportunity_key,'powerhouse'),
    a.person_key,a.company_key,a.channel,v_now,
    jsonb_build_object(
      'action_id',a.action_id,
      'action_type',a.action_type,
      'executed_at',a.executed_at,
      'provider_execution',coalesce(a.evidence->'execution','{}'::jsonb)
    ),
    jsonb_build_object(
      'measurement_horizon',case
        when v_now >= a.executed_at + interval '30 days' then 'T+30d'
        when v_now >= a.executed_at + interval '7 days' then 'T+7d'
        when v_now >= a.executed_at + interval '24 hours' then 'T+24h'
        when v_now >= a.executed_at + interval '1 hour' then 'T+1h'
        else 'T+<1h'
      end,
      'truth_boundary','pending external outcome is explicit; do not fabricate no_response or revenue',
      'repair_owner','existing provider/readback route'
    ),
    'decided','system',1,a.opportunity_key,v_now
  from public.powerhouse_sales_actions a
  where a.executed_at is not null
    and a.outcome_id is null
    and not exists (select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)
  on conflict (dedupe_key) do update
    set evidence=excluded.evidence,context=excluded.context,state='decided',updated_at=v_now;
  get diagnostics v_outcome_obligations = row_count;

  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,
    reason,evidence,message_draft,status,due_at,content_key,topic_key,campaign_key,
    opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'gap:research:'||o.opportunity_key,
    o.subject_key,o.person_key,o.company_key,'research_enrichment','internal',35,
    'Economic value is zero because evidence is insufficient; enrich company/problem/buying-trigger evidence before any revenue claim.',
    jsonb_build_object(
      'gap_closer_contract','powerhouse-autonomous-gap-closer-v1',
      'last_evidence_at',o.last_evidence_at,
      'current_probability',o.probability,
      'current_confidence',o.confidence,
      'current_score_components',coalesce(o.score_components,'{}'::jsonb),
      'truth_boundary','no invented monetary value'
    ),
    '','suggested',v_now,o.content_key,o.topic_key,o.campaign_key,o.opportunity_key,0,
    null,null,null
  from public.powerhouse_opportunities o
  where o.status='open'
    and coalesce(o.expected_value_eur,0)<=0
    and coalesce(o.expected_revenue_value,0)<=0
  on conflict (dedupe_key) do update
    set reason=excluded.reason,evidence=excluded.evidence,due_at=excluded.due_at,updated_at=v_now;
  get diagnostics v_research_actions = row_count;

  select count(*) into v_active_forecasts
  from public.powerhouse_forecasts where status in ('active','claimed');

  if v_active_forecasts=0 then
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-predictive-engine',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := jsonb_build_object('runDate',p_run_date::text,'trigger','powerhouse-autonomous-gap-closer-v1'),
      timeout_milliseconds := 120000
    ) into v_forecast_request;
  end if;

  select count(*) into v_due_calibrations
  from public.powerhouse_forecasts f
  where f.horizon_end < p_run_date
    and not exists (select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=f.forecast_id);

  if v_due_calibrations>0 then
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-forecast-calibrator',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := jsonb_build_object('trigger','powerhouse-autonomous-gap-closer-v1'),
      timeout_milliseconds := 120000
    ) into v_calibration_request;
  end if;

  select count(*) into v_active_experiments
  from public.social_experiments
  where tenant_id='canonical' and status in ('ACTIVE','PLANNED');

  if v_active_experiments=0 then
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-experimentcyclus',
      headers := jsonb_build_object('content-type','application/json'),
      body := jsonb_build_object('trigger','powerhouse-autonomous-gap-closer-v1'),
      timeout_milliseconds := 120000
    ) into v_experiment_request;
  end if;

  select count(*) into v_unmanaged_gaps
  from public.powerhouse_gap_register_v1 g
  where (g.gap_type='OUTCOME_READBACK' and not exists (
          select 1 from public.powerhouse_runtime_events e
          where e.dedupe_key like 'gap:outcome-readback:'||g.action_id::text||':%'
        ))
     or (g.gap_type='RESEARCH_ENRICHMENT' and not exists (
          select 1 from public.powerhouse_sales_actions a where a.dedupe_key='gap:research:'||g.opportunity_key
        ))
     or (g.gap_type='FORECAST_GENERATION' and v_forecast_request is null)
     or (g.gap_type='FORECAST_CALIBRATION' and v_calibration_request is null)
     or (g.gap_type='EXPERIMENT_ACTIVATION' and v_experiment_request is null);

  v_result := jsonb_build_object(
    'contract','powerhouse-autonomous-gap-closer-v1',
    'run_date',p_run_date,
    'executed_at',v_now,
    'healthy',v_unmanaged_gaps=0,
    'unmanaged_structural_gaps',v_unmanaged_gaps,
    'outcome_readback_obligations_touched',v_outcome_obligations,
    'research_enrichment_actions_touched',v_research_actions,
    'active_forecasts_before_repair',v_active_forecasts,
    'due_calibrations_before_repair',v_due_calibrations,
    'active_experiments_before_repair',v_active_experiments,
    'predictive_engine_request_id',v_forecast_request,
    'calibrator_request_id',v_calibration_request,
    'experiment_engine_request_id',v_experiment_request,
    'revenue_cycle',v_cycle,
    'truth_boundary','structural gaps are auto-managed; external outcomes remain pending until observed'
  );

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,
    content_key,topic_key,channel,sample_size,expires_at
  ) values (
    'powerhouse-autonomous-gap-closer-v1','powerhouse','growth_revenue_os',
    'Structural revenue-flywheel gaps should be detected, repaired or converted to explicit evidence obligations automatically without fabricating business outcomes.',
    v_result,
    jsonb_build_object(
      'primary_effect','no_silent_structural_gaps',
      'truth_boundary','pending external outcome remains pending until observed',
      'repair_routes',jsonb_build_array('existing revenue cycle','predictive engine','forecast calibrator','experimentcyclus','runtime readback obligations','research enrichment')
    ),
    case when v_unmanaged_gaps=0 then 0.95 else 0.40 end,
    'active',null,null,null,
    greatest(1,v_outcome_obligations+v_research_actions+v_active_forecasts+v_due_calibrations+v_active_experiments),
    v_now + interval '30 days'
  )
  on conflict (fingerprint) do update
    set evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,
        sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=v_now;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'gap-closer:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'autonomous_gap_closer_cycle','powerhouse-autonomous-gap-closer-v1','powerhouse',v_now,
    v_result,
    jsonb_build_object('policy','powerhouse-revenue-flywheel-v1','no_parallel_system',true),
    case when v_unmanaged_gaps=0 then 'actioned' else 'error' end,
    'verified',1,v_now
  )
  on conflict (dedupe_key) do update
    set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'gap-closer-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'autonomous_gap_closer_failed','powerhouse-autonomous-gap-closer-v1','powerhouse',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate,'run_date',p_run_date),
    jsonb_build_object('fail_closed',true),'error','verified',1,now()
  ) on conflict (dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-autonomous-gap-closer-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end $$;

revoke execute on function public.powerhouse_autonomous_gap_closer_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_gap_closer_v1(date) to service_role;

create or replace function public.powerhouse_record_flywheel_health_v1()
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_id uuid;
begin
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  )
  select
    'revenue-flywheel-health-'||to_char(now() at time zone 'UTC','YYYYMMDDHH24'),
    'revenue_flywheel_health','powerhouse_revenue_flywheel_v1','powerhouse',now(),
    jsonb_build_object(
      'open_opportunities',open_opportunities,
      'weighted_pipeline_eur',weighted_pipeline_eur,
      'expected_value_eur',expected_value_eur,
      'pending_actions',pending_actions,
      'pending_external_outcomes',pending_external_outcomes,
      'unmanaged_outcome_gaps',executed_without_outcome,
      'realized_revenue_eur',realized_revenue_eur,
      'forecast_count',forecast_count,
      'open_forecasts',open_forecasts,
      'due_uncalibrated_forecasts',due_uncalibrated_forecasts,
      'calibration_count',calibration_count,
      'active_experiments',active_experiments,
      'experiments_awaiting_decision',experiments_awaiting_decision
    ),
    jsonb_build_object(
      'outcome_gap',outcome_gap,
      'calibration_gap',calibration_gap,
      'experiment_decision_gap',experiment_decision_gap,
      'truth_boundary','pending external outcome is not a structural gap when an explicit readback obligation exists'
    ),
    case when outcome_gap or calibration_gap or experiment_decision_gap then 'error' else 'observed' end,
    'verified',1
  from public.powerhouse_revenue_flywheel_v1
  on conflict (dedupe_key) do update
    set evidence=excluded.evidence,context=excluded.context,state=excluded.state,
        data_quality=excluded.data_quality,updated_at=now()
  returning event_id into v_id;
  return v_id;
end $$;

revoke execute on function public.powerhouse_record_flywheel_health_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_record_flywheel_health_v1() to service_role;

do $$
begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='powerhouse-autonomous-gap-closer-v1';
    perform cron.schedule(
      'powerhouse-autonomous-gap-closer-v1',
      '22 * * * *',
      'select public.powerhouse_autonomous_gap_closer_v1();'
    );
  end if;
end $$;
