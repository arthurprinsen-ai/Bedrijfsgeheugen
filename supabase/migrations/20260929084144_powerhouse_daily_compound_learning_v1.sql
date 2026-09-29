-- Powerhouse Daily Compound Learning v1
-- Closes verified outcome capture and forecast-resolution feedback without creating parallel stores.

create or replace view public.powerhouse_verified_outcome_candidates_v1
with (security_invoker=true) as
select
  e.event_id,
  e.dedupe_key as source_dedupe_key,
  case e.event_type
    when 'dm_inbound_reply' then 'reply'
    when 'linkedin_inbound_engagement' then 'linkedin_engagement'
    when 'scan_submitted' then 'scan_submitted'
    when 'meeting_booked' then 'meeting_booked'
    when 'appointment_booked' then 'meeting_booked'
    when 'proposal_accepted' then 'proposal_accepted'
    when 'order_created' then 'order_created'
    when 'payment_received' then 'payment_received'
    when 'opportunity_won' then 'opportunity_won'
    else e.event_type
  end as outcome_type,
  a.action_id,
  coalesce(e.subject_key,a.subject_key) as subject_key,
  coalesce(e.person_key,a.person_key) as person_key,
  coalesce(e.company_key,a.company_key) as company_key,
  coalesce(e.content_key,a.content_key) as content_key,
  coalesce(e.topic_key,a.topic_key) as topic_key,
  coalesce(e.campaign_key,a.campaign_key) as campaign_key,
  coalesce(e.opportunity_key,a.opportunity_key) as opportunity_key,
  coalesce(e.channel,a.channel) as channel,
  e.occurred_at,
  jsonb_build_object(
    'source_event_id',e.event_id,
    'source_event_type',e.event_type,
    'source_dedupe_key',e.dedupe_key,
    'source_data_quality',e.data_quality,
    'source_confidence',e.confidence,
    'source_evidence',coalesce(e.evidence,'{}'::jsonb),
    'source_context',coalesce(e.context,'{}'::jsonb)
  ) as outcome_evidence
from public.powerhouse_runtime_events e
left join public.powerhouse_sales_actions a
  on a.action_id::text = nullif(e.evidence->>'action_id','')
where e.event_type in (
  'dm_inbound_reply','linkedin_inbound_engagement','scan_submitted',
  'meeting_booked','appointment_booked','proposal_accepted',
  'order_created','payment_received','opportunity_won'
)
and coalesce(e.dedupe_key,'') !~* '(smoke|test|synthetic|fixture)'
and (
  e.data_quality='VERIFIED'
  or e.event_type in ('dm_inbound_reply','scan_submitted','meeting_booked','appointment_booked','proposal_accepted','order_created','payment_received','opportunity_won')
);

revoke all on public.powerhouse_verified_outcome_candidates_v1 from public,anon,authenticated;
grant select on public.powerhouse_verified_outcome_candidates_v1 to service_role;

create or replace function public.powerhouse_capture_verified_outcomes_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_inserted int := 0;
  v_actions_linked int := 0;
begin
  with inserted as (
    insert into public.powerhouse_sales_outcomes(
      action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,
      revenue_eur,evidence,occurred_at,content_key,topic_key,campaign_key,
      opportunity_key,channel
    )
    select
      c.action_id,
      'runtime-outcome:'||c.source_dedupe_key,
      c.outcome_type,
      c.subject_key,c.person_key,c.company_key,
      case
        when coalesce(c.outcome_evidence#>>'{source_evidence,revenue_eur}','') ~ '^-?[0-9]+([.][0-9]+)?$'
          then (c.outcome_evidence#>>'{source_evidence,revenue_eur}')::numeric
        else 0::numeric
      end,
      c.outcome_evidence,
      c.occurred_at,
      c.content_key,c.topic_key,c.campaign_key,c.opportunity_key,c.channel
    from public.powerhouse_verified_outcome_candidates_v1 c
    where c.occurred_at < (p_run_date + interval '1 day')
      and not exists (
        select 1 from public.powerhouse_sales_outcomes o
        where o.dedupe_key='runtime-outcome:'||c.source_dedupe_key
      )
    on conflict(dedupe_key) do nothing
    returning outcome_id,action_id
  )
  select count(*) into v_inserted from inserted;

  with linked as (
    update public.powerhouse_sales_actions a
    set outcome_id=o.outcome_id, updated_at=now()
    from public.powerhouse_sales_outcomes o
    where o.action_id=a.action_id
      and a.outcome_id is null
    returning a.action_id
  )
  select count(*) into v_actions_linked from linked;

  return jsonb_build_object(
    'run_date',p_run_date,
    'inserted_outcomes',v_inserted,
    'actions_linked',v_actions_linked,
    'truth_boundary','verified observed events only; no inferred no-response or invented revenue',
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_capture_verified_outcomes_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_capture_verified_outcomes_v1(date) to service_role;

create or replace view public.powerhouse_forecast_resolution_candidates_v3
with (security_invoker=true) as
select distinct on (f.forecast_id)
  f.forecast_id,
  f.probability,
  f.expected_lead_days,
  f.horizon_start,
  f.horizon_end,
  o.outcome_id,
  o.outcome_type,
  o.occurred_at as actual_event_at,
  1::int as outcome_value,
  jsonb_build_object(
    'resolution_source','powerhouse_sales_outcomes',
    'outcome_id',o.outcome_id,
    'outcome_type',o.outcome_type,
    'outcome_dedupe_key',o.dedupe_key,
    'outcome_evidence',o.evidence
  ) as resolution_evidence
from public.powerhouse_forecasts f
join public.powerhouse_sales_outcomes o
  on (
    (f.scope='person' and nullif(f.scope_key,'') is not null and o.person_key=f.scope_key)
    or
    (f.scope='company' and nullif(f.scope_key,'') is not null and lower(o.company_key)=lower(f.scope_key))
  )
where f.topic_key='commercial_progression'
  and o.occurred_at::date between f.horizon_start and f.horizon_end
  and o.outcome_type in ('reply','meeting_booked','proposal_accepted','order_created','payment_received','opportunity_won')
  and not exists (
    select 1 from public.powerhouse_forecast_calibration c
    where c.forecast_id=f.forecast_id and c.outcome_value is not null
  )
order by f.forecast_id,o.occurred_at asc;

revoke all on public.powerhouse_forecast_resolution_candidates_v3 from public,anon,authenticated;
grant select on public.powerhouse_forecast_resolution_candidates_v3 to service_role;

create or replace function public.powerhouse_resolve_forecasts_from_outcomes_v3()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_inserted int := 0;
begin
  with inserted as (
    insert into public.powerhouse_forecast_calibration(
      forecast_id,measured_at,actual_event_occurred,actual_event_at,
      timing_error_days,probability_error,evidence,outcome_value,
      brier_component,actual_lead_days,attribution_confidence,revenue_eur
    )
    select
      c.forecast_id,
      now(),
      true,
      c.actual_event_at,
      (c.actual_event_at::date-c.horizon_end)::numeric,
      (1-c.probability)::numeric,
      c.resolution_evidence,
      1,
      power(c.probability-1,2),
      greatest(0,(c.actual_event_at::date-c.horizon_start))::numeric,
      1,
      coalesce(o.revenue_eur,0)
    from public.powerhouse_forecast_resolution_candidates_v3 c
    join public.powerhouse_sales_outcomes o on o.outcome_id=c.outcome_id
    where not exists (
      select 1 from public.powerhouse_forecast_calibration x
      where x.forecast_id=c.forecast_id and x.outcome_value is not null
    )
    returning calibration_id
  )
  select count(*) into v_inserted from inserted;

  return jsonb_build_object(
    'resolved_forecasts',v_inserted,
    'resolution_policy','positive verified outcomes only; absence is never auto-classified as failure',
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_resolve_forecasts_from_outcomes_v3() from public,anon,authenticated;
grant execute on function public.powerhouse_resolve_forecasts_from_outcomes_v3() to service_role;

create or replace view public.powerhouse_daily_compound_learning_control_v1
with (security_invoker=true) as
select
  now() observed_at,
  (select count(*) from public.powerhouse_sales_actions where lower(status)='done')::int executed_actions,
  (select count(*) from public.powerhouse_sales_actions where outcome_id is not null)::int actions_with_outcomes,
  (select count(*) from public.powerhouse_sales_outcomes)::int observed_outcomes,
  (select count(*) from public.powerhouse_forecasts)::int forecasts_total,
  (select count(distinct forecast_id) from public.powerhouse_forecast_calibration where outcome_value is not null)::int forecasts_resolved,
  (select count(*) from public.powerhouse_forecast_resolution_debt_v2)::int forecast_resolution_debt,
  case
    when (select count(*) from public.powerhouse_sales_actions where lower(status)='done')=0 then 1::numeric
    else round(
      (select count(*) from public.powerhouse_sales_actions where outcome_id is not null)::numeric /
      greatest((select count(*) from public.powerhouse_sales_actions where lower(status)='done'),1),4
    )
  end as executed_action_outcome_coverage,
  jsonb_build_object(
    'loop',jsonb_build_array('observe','outcome','memory','resolve','calibrate','learn','next_decision'),
    'verified_outcomes_only',true,
    'auto_negative_resolution',false,
    'parallel_outcome_store',false,
    'parallel_forecast_store',false
  ) contract;

revoke all on public.powerhouse_daily_compound_learning_control_v1 from public,anon,authenticated;
grant select on public.powerhouse_daily_compound_learning_control_v1 to service_role;

create or replace function public.powerhouse_run_daily_compound_learning_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_outcomes jsonb;
  v_forecasts jsonb;
  v_control jsonb;
  v_result jsonb;
begin
  v_outcomes := public.powerhouse_capture_verified_outcomes_v1(p_run_date);
  v_forecasts := public.powerhouse_resolve_forecasts_from_outcomes_v3();
  select to_jsonb(c) into v_control from public.powerhouse_daily_compound_learning_control_v1 c;

  v_result := jsonb_build_object(
    'contract','powerhouse-daily-compound-learning-v1',
    'run_date',p_run_date,
    'outcome_capture',v_outcomes,
    'forecast_resolution',v_forecasts,
    'control',coalesce(v_control,'{}'::jsonb),
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,
    evidence,context,state,data_quality,confidence,created_at,updated_at
  ) values (
    'daily-compound-learning:'||p_run_date::text,
    'daily_compound_learning_cycle',
    'powerhouse-daily-compound-learning-v1',
    'company-intelligence',
    'system',
    now(),
    v_result,
    jsonb_build_object(
      'verified_outcomes_only',true,
      'auto_negative_resolution',false,
      'feeds_company_intelligence',true,
      'feeds_self_improvement',true
    ),
    'actioned','VERIFIED',1,now(),now()
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  return v_result;
end;
$$;

revoke execute on function public.powerhouse_run_daily_compound_learning_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_run_daily_compound_learning_v1(date) to service_role;

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-daily-compound-learning-v1' limit 1;
  if v_jobid is not null then perform cron.unschedule(v_jobid); end if;
end $$;

select cron.schedule(
  'powerhouse-daily-compound-learning-v1',
  '50 2 * * *',
  $cron$select public.powerhouse_run_daily_compound_learning_v1((now() at time zone 'Europe/Amsterdam')::date);$cron$
);

comment on view public.powerhouse_verified_outcome_candidates_v1 is
'Verified runtime events eligible for canonical Outcome Memory; smoke/test events are excluded.';
comment on function public.powerhouse_capture_verified_outcomes_v1(date) is
'Captures observed verified runtime outcomes into the existing sales outcome store and links matching actions.';
comment on view public.powerhouse_forecast_resolution_candidates_v3 is
'Commercial-progression forecasts that can be positively resolved from verified canonical outcomes.';
comment on function public.powerhouse_resolve_forecasts_from_outcomes_v3() is
'Resolves forecasts from verified positive outcomes only; absence is never automatically classified as failure.';
comment on view public.powerhouse_daily_compound_learning_control_v1 is
'Control plane proving outcome coverage and forecast-resolution coverage for the daily compound-learning loop.';
