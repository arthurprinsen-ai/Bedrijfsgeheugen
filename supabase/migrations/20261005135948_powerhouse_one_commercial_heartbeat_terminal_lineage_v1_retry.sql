-- POWERHOUSE one commercial heartbeat + terminal action/outcome lineage v1
-- Canonicalizes the commercial decision owner, removes direct composer/closure schedulers,
-- and makes terminal action -> outcome coverage measurable and self-healing.

create or replace function public.powerhouse_terminalize_action_outcome_lineage_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_inserted int := 0;
  v_linked int := 0;
  v_terminal int := 0;
  v_missing int := 0;
begin
  insert into public.powerhouse_sales_outcomes(
    outcome_id, action_id, dedupe_key, outcome_type, subject_key, person_key, company_key,
    revenue_eur, evidence, occurred_at, content_key, topic_key, campaign_key, opportunity_key, channel
  )
  select
    gen_random_uuid(),
    a.action_id,
    'terminal-action:' || a.action_id::text,
    case
      when a.status = 'done' then 'execution_completed'
      when a.status = 'failed' then 'execution_failed'
      else 'not_executed'
    end,
    a.subject_key,
    a.person_key,
    a.company_key,
    0,
    jsonb_build_object(
      'contract','powerhouse-terminal-action-outcome-lineage-v1',
      'action_status',a.status,
      'reason',coalesce(a.reason,''),
      'terminal_evidence',coalesce(a.evidence,'{}'::jsonb),
      'synthetic_business_result',false,
      'meaning','Terminal lifecycle outcome only; does not fabricate reply, meeting, order or revenue.'
    ),
    coalesce(a.executed_at,a.updated_at,a.created_at,now()),
    a.content_key,
    a.topic_key,
    a.campaign_key,
    a.opportunity_key,
    a.channel
  from public.powerhouse_sales_actions a
  where a.created_at >= p_run_date::timestamp at time zone 'Europe/Amsterdam'
    and a.created_at < (p_run_date + 1)::timestamp at time zone 'Europe/Amsterdam'
    and a.status in ('done','expired','skipped','failed','cancelled')
    and a.outcome_id is null
    and not exists (
      select 1
      from public.powerhouse_sales_outcomes o
      where o.action_id = a.action_id
    );
  get diagnostics v_inserted = row_count;

  with picked as (
    select distinct on (o.action_id) o.action_id, o.outcome_id
    from public.powerhouse_sales_outcomes o
    where o.action_id is not null
    order by o.action_id, o.occurred_at desc nulls last, o.created_at desc
  )
  update public.powerhouse_sales_actions a
  set outcome_id = p.outcome_id,
      updated_at = now()
  from picked p
  where p.action_id = a.action_id
    and a.outcome_id is null
    and a.created_at >= p_run_date::timestamp at time zone 'Europe/Amsterdam'
    and a.created_at < (p_run_date + 1)::timestamp at time zone 'Europe/Amsterdam'
    and a.status in ('done','expired','skipped','failed','cancelled');
  get diagnostics v_linked = row_count;

  select
    count(*)::int,
    count(*) filter (where a.outcome_id is null and not exists (
      select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id
    ))::int
  into v_terminal, v_missing
  from public.powerhouse_sales_actions a
  where a.created_at >= p_run_date::timestamp at time zone 'Europe/Amsterdam'
    and a.created_at < (p_run_date + 1)::timestamp at time zone 'Europe/Amsterdam'
    and a.status in ('done','expired','skipped','failed','cancelled');

  return jsonb_build_object(
    'contract','powerhouse-terminal-action-outcome-lineage-v1',
    'run_date',p_run_date,
    'terminal_actions',v_terminal,
    'new_outcomes',v_inserted,
    'new_links',v_linked,
    'terminal_missing_outcome',v_missing,
    'terminal_coverage_pct',case when v_terminal=0 then 100 else round(100.0*(v_terminal-v_missing)/v_terminal,2) end,
    'healthy',v_missing=0
  );
end
$function$;

revoke all on function public.powerhouse_terminalize_action_outcome_lineage_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_terminalize_action_outcome_lineage_v1(date) to service_role;

create or replace function public.powerhouse_commercial_regression_gate_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_owner_count int := 0;
  v_direct_composer_owners int := 0;
  v_v2_count int := 0;
  v_terminal int := 0;
  v_missing int := 0;
  v_payload jsonb;
begin
  select count(*)::int into v_owner_count
  from cron.job
  where active
    and command ilike '%powerhouse_commercial_heartbeat_v1%';

  select count(*)::int into v_direct_composer_owners
  from cron.job
  where active
    and (
      command ilike '%powerhouse-commercial-message-composer%'
      or command ilike '%powerhouse_dispatch_human_sales_composer_v2%'
      or command ilike '%powerhouse_one_commercial_decision_loop_v1%'
    )
    and command not ilike '%powerhouse_commercial_heartbeat_v1%';

  select count(*)::int into v_v2_count
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in ('powerhouse_one_commercial_decision_loop_v2','powerhouse_commercial_heartbeat_v2');

  select
    count(*)::int,
    count(*) filter (where a.outcome_id is null and not exists (
      select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id
    ))::int
  into v_terminal, v_missing
  from public.powerhouse_sales_actions a
  where a.created_at >= p_run_date::timestamp at time zone 'Europe/Amsterdam'
    and a.created_at < (p_run_date + 1)::timestamp at time zone 'Europe/Amsterdam'
    and a.status in ('done','expired','skipped','failed','cancelled');

  v_payload := jsonb_build_object(
    'contract','powerhouse-commercial-regression-gate-v1',
    'run_date',p_run_date,
    'canonical_scheduler_owners',v_owner_count,
    'direct_secondary_scheduler_owners',v_direct_composer_owners,
    'forbidden_v2_functions',v_v2_count,
    'terminal_actions',v_terminal,
    'terminal_missing_outcome',v_missing,
    'terminal_coverage_pct',case when v_terminal=0 then 100 else round(100.0*(v_terminal-v_missing)/v_terminal,2) end,
    'healthy',v_owner_count=1 and v_direct_composer_owners=0 and v_v2_count=0 and v_missing=0
  );

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    now(),
    'powerhouse-commercial-regression-gate',
    'canonical-heartbeat-lineage',
    case when (v_payload->>'healthy')::boolean then 'ok' else 'fout' end,
    'One commercial heartbeat, no v2 drift, and terminal action/outcome coverage.',
    v_payload
  );

  return v_payload;
end
$function$;

revoke all on function public.powerhouse_commercial_regression_gate_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_regression_gate_v1(date) to service_role;

create or replace function public.powerhouse_commercial_heartbeat_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_run_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_full_needed boolean := false;
  v_full jsonb := '{}'::jsonb;
  v_composer jsonb := '{}'::jsonb;
  v_closure jsonb := '{}'::jsonb;
  v_terminal jsonb := '{}'::jsonb;
  v_output jsonb := '{}'::jsonb;
  v_gate jsonb := '{}'::jsonb;
begin
  select not exists (
    select 1
    from public.powerhouse_runtime_events e
    where e.dedupe_key='one-commercial-decision-loop:'||v_run_date::text
      and e.occurred_at >= v_run_date::timestamp at time zone 'Europe/Amsterdam'
  ) into v_full_needed;

  if v_full_needed then
    v_full := public.powerhouse_one_commercial_decision_loop_v1(v_run_date);
  else
    v_composer := public.powerhouse_dispatch_human_sales_composer_v2(5);
    v_closure := public.powerhouse_commercial_action_closure_watchdog_v1(p_now);
    v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1(v_run_date);
    v_output := public.powerhouse_commercial_output_assurance_v1(v_run_date);
  end if;

  v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1(v_run_date);
  v_gate := public.powerhouse_commercial_regression_gate_v1(v_run_date);

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-heartbeat:'||to_char(p_now at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_heartbeat',
    'powerhouse-commercial-heartbeat-v1',
    'growth-revenue-os',
    p_now,
    jsonb_build_object(
      'full_cycle_executed',v_full_needed,
      'full_cycle',v_full,
      'composer',v_composer,
      'closure',v_closure,
      'terminal_lineage',v_terminal,
      'output_assurance',v_output,
      'regression_gate',v_gate
    ),
    jsonb_build_object(
      'single_scheduler_owner',true,
      'existing_state_first',true,
      'terminal_lineage_required',true,
      'provider_execution_owned_by_canonical_channel_executors',true
    ),
    case when coalesce((v_gate->>'healthy')::boolean,false) then 'actioned' else 'degraded' end,
    case when coalesce((v_gate->>'healthy')::boolean,false) then 'VERIFIED' else 'PARTIAL' end,
    case when coalesce((v_gate->>'healthy')::boolean,false) then 1 else 0.5 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-heartbeat-v1',
    'run_date',v_run_date,
    'full_cycle_executed',v_full_needed,
    'terminal_lineage',v_terminal,
    'regression_gate',v_gate,
    'healthy',coalesce((v_gate->>'healthy')::boolean,false),
    'executed_at',p_now
  );
end
$function$;

revoke all on function public.powerhouse_commercial_heartbeat_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_heartbeat_v1(timestamptz) to service_role;

do $block$
declare r record;
begin
  for r in
    select jobid from cron.job
    where jobname in (
      'powerhouse-commercial-action-closure-v1',
      'powerhouse-commercial-output-assurance-v1',
      'powerhouse-human-commercial-composer-v1',
      'powerhouse-sales-machine-daily-v6',
      'powerhouse-human-sales-composer-v2',
      'powerhouse-one-commercial-heartbeat-v1'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end
$block$;

select cron.schedule(
  'powerhouse-one-commercial-heartbeat-v1',
  '*/5 * * * *',
  $$select public.powerhouse_commercial_heartbeat_v1(now());$$
);

select public.powerhouse_terminalize_action_outcome_lineage_v1((now() at time zone 'Europe/Amsterdam')::date);
select public.powerhouse_commercial_regression_gate_v1((now() at time zone 'Europe/Amsterdam')::date);
