create or replace function public.powerhouse_sync_loop_assurance_receipts_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  r record;
  v_window interval;
  v_event record;
  v_cron record;
  v_written integer := 0;
begin
  for r in
    select *
    from public.powerhouse_loop_assurance_registry_v1
    where active = true
    order by loop_key
  loop
    v_window := make_interval(mins => greatest(r.expected_cadence_minutes * 2, 10));

    v_event := null;
    if r.runtime_source is not null then
      select e.event_type,e.state,e.occurred_at,e.evidence,e.context,e.subject_key
      into v_event
      from public.powerhouse_runtime_events e
      where e.source = r.runtime_source
        and e.occurred_at >= p_now - v_window
      order by e.occurred_at desc, e.updated_at desc
      limit 1;
    end if;

    v_cron := null;
    if r.cron_jobname is not null then
      select d.status,d.start_time,d.end_time,d.return_message
      into v_cron
      from cron.job_run_details d
      join cron.job j on j.jobid=d.jobid
      where j.jobname=r.cron_jobname
        and d.start_time >= p_now - v_window
      order by d.start_time desc
      limit 1;
    end if;

    if v_cron.start_time is not null then
      insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
      values (
        r.loop_key,'input',v_cron.start_time,
        jsonb_build_object('evidence_type','cron_invocation','job',r.cron_jobname,'status',v_cron.status,'start_time',v_cron.start_time,'end_time',v_cron.end_time),
        p_now
      )
      on conflict (loop_key,stage) do update
        set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
      where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
      v_written := v_written + 1;

      if lower(coalesce(v_cron.status,'')) = 'succeeded' then
        insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
        values (
          r.loop_key,'decision',coalesce(v_cron.end_time,v_cron.start_time),
          jsonb_build_object('evidence_type','scheduled_policy_execution','job',r.cron_jobname,'status',v_cron.status),
          p_now
        )
        on conflict (loop_key,stage) do update
          set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
        where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
        v_written := v_written + 1;
      end if;
    end if;

    if v_event.occurred_at is not null then
      insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
      values (
        r.loop_key,'readback',v_event.occurred_at,
        jsonb_build_object('evidence_type','runtime_event','source',r.runtime_source,'event_type',v_event.event_type,'state',v_event.state,'subject_key',v_event.subject_key),
        p_now
      )
      on conflict (loop_key,stage) do update
        set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
      where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
      v_written := v_written + 1;

      insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
      values (
        r.loop_key,'measurement',v_event.occurred_at,
        jsonb_build_object('evidence_type','runtime_observation','source',r.runtime_source,'event_type',v_event.event_type,'state',v_event.state),
        p_now
      )
      on conflict (loop_key,stage) do update
        set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
      where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
      v_written := v_written + 1;

      if lower(coalesce(v_event.state,'')) in ('actioned','closed') then
        insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
        values (
          r.loop_key,'action',v_event.occurred_at,
          jsonb_build_object('evidence_type','runtime_action','source',r.runtime_source,'event_type',v_event.event_type,'state',v_event.state),
          p_now
        )
        on conflict (loop_key,stage) do update
          set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
        where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
        v_written := v_written + 1;
      end if;

      if lower(coalesce(v_event.state,'')) = 'closed' then
        insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
        values (
          r.loop_key,'outcome',v_event.occurred_at,
          jsonb_build_object('evidence_type','runtime_closed_outcome','source',r.runtime_source,'event_type',v_event.event_type,'state',v_event.state),
          p_now
        )
        on conflict (loop_key,stage) do update
          set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
        where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
        v_written := v_written + 1;
      end if;
    end if;
  end loop;

  return v_written;
end;
$$;

create or replace function public.powerhouse_refresh_loop_assurance_v1(p_now timestamptz default now())
returns table(out_loop_key text,out_status text,out_reason text)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  r record;
  v_last_runtime timestamptz;
  v_scheduler_active boolean;
  v_required_count integer;
  v_fresh_stage_count integer;
  v_missing_stages text[];
  v_status text;
  v_reason text;
  v_next_expected timestamptz;
  v_window interval;
begin
  perform public.powerhouse_sync_loop_assurance_receipts_v1(p_now);

  for r in
    select *
    from public.powerhouse_loop_assurance_registry_v1
    where active = true
    order by loop_key
  loop
    v_window := make_interval(mins => r.expected_cadence_minutes * 2);

    if r.runtime_source is null then
      v_last_runtime := null;
    else
      select max(e.occurred_at)
      into v_last_runtime
      from public.powerhouse_runtime_events e
      where e.source = r.runtime_source;
    end if;

    if r.cron_jobname is null then
      v_scheduler_active := null;
    else
      select coalesce(bool_or(j.active),false)
      into v_scheduler_active
      from cron.job j
      where j.jobname = r.cron_jobname;
    end if;

    select cardinality(r.required_stages),
           count(*) filter (where rr.observed_at >= p_now - v_window),
           coalesce(array_agg(s.stage order by s.stage) filter (where rr.observed_at is null or rr.observed_at < p_now - v_window),'{}'::text[])
    into v_required_count, v_fresh_stage_count, v_missing_stages
    from unnest(r.required_stages) as s(stage)
    left join public.powerhouse_loop_assurance_receipts_v1 rr
      on rr.loop_key = r.loop_key and rr.stage = s.stage;

    if r.cron_jobname is not null and coalesce(v_scheduler_active,false) = false then
      v_status := 'RED';
      v_reason := 'scheduler missing or inactive';
    elsif r.runtime_source is not null and v_last_runtime is null then
      v_status := 'RED';
      v_reason := 'no runtime evidence';
    elsif r.runtime_source is not null and v_last_runtime < p_now - v_window then
      v_status := 'RED';
      v_reason := 'runtime evidence stale beyond 2x cadence';
    elsif v_fresh_stage_count = 0 and r.critical then
      v_status := 'RED';
      v_reason := 'critical loop has zero fresh closed-loop stage evidence';
    elsif v_fresh_stage_count < v_required_count then
      v_status := 'AMBER';
      v_reason := 'closed-loop stage evidence incomplete or stale';
    elsif r.runtime_source is not null and v_last_runtime < p_now - make_interval(mins => r.expected_cadence_minutes) then
      v_status := 'AMBER';
      v_reason := 'runtime evidence older than expected cadence';
    else
      v_status := 'GREEN';
      v_reason := 'scheduler/runtime/stage evidence current';
    end if;

    v_next_expected := case
      when v_last_runtime is not null then v_last_runtime + make_interval(mins => r.expected_cadence_minutes)
      else p_now + make_interval(mins => r.expected_cadence_minutes)
    end;

    insert into public.powerhouse_loop_assurance_state_v1(
      loop_key,status,last_runtime_at,scheduler_active,fresh_stage_count,required_stage_count,
      missing_stages,next_expected_at,reason,checked_at,evidence
    ) values (
      r.loop_key,v_status,v_last_runtime,v_scheduler_active,v_fresh_stage_count,v_required_count,
      v_missing_stages,v_next_expected,v_reason,p_now,
      jsonb_build_object(
        'runtime_source',r.runtime_source,
        'cron_jobname',r.cron_jobname,
        'expected_cadence_minutes',r.expected_cadence_minutes,
        'critical',r.critical,
        'receipt_sync','canonical-runtime-and-cron-only'
      )
    )
    on conflict on constraint powerhouse_loop_assurance_state_v1_pkey do update set
      status=excluded.status,
      last_runtime_at=excluded.last_runtime_at,
      scheduler_active=excluded.scheduler_active,
      fresh_stage_count=excluded.fresh_stage_count,
      required_stage_count=excluded.required_stage_count,
      missing_stages=excluded.missing_stages,
      next_expected_at=excluded.next_expected_at,
      reason=excluded.reason,
      checked_at=excluded.checked_at,
      evidence=excluded.evidence;

    insert into public.brain_obligations(
      obligation_type,capability_id,business_entity,business_period,business_timezone,
      payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version
    ) values (
      'OPERATIONS_ASSURANCE',
      r.loop_key,
      'powerhouse-loop-assurance-v2',
      'continuous',
      'Europe/Amsterdam',
      md5(r.loop_key || ':' || v_status || ':' || coalesce(v_reason,'')),
      'powerhouse-loop-assurance-v2',
      'Powerhouse',
      case when v_status='GREEN' then 'FULFILLED' else 'OPEN' end,
      jsonb_build_object(
        'assurance_status',v_status,
        'reason',v_reason,
        'missing_stages',v_missing_stages,
        'last_runtime_at',v_last_runtime,
        'next_expected_at',v_next_expected,
        'checked_at',p_now
      ),
      p_now,p_now,1
    )
    on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
    do update set
      state = excluded.state,
      evidence = excluded.evidence,
      payload_sha256 = excluded.payload_sha256,
      updated_at = excluded.updated_at,
      version = public.brain_obligations.version + 1;

    out_loop_key := r.loop_key;
    out_status := v_status;
    out_reason := v_reason;
    return next;
  end loop;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,created_at,updated_at
  )
  select
    'loop-assurance:' || to_char(date_trunc('minute',p_now),'YYYYMMDDHH24MI'),
    'loop_assurance_refresh',
    'powerhouse-loop-assurance-v2',
    'all-active-loops',
    'internal',
    p_now,
    jsonb_build_object(
      'green',count(*) filter (where s.status='GREEN'),
      'amber',count(*) filter (where s.status='AMBER'),
      'red',count(*) filter (where s.status='RED'),
      'zero_receipt_critical',count(*) filter (where s.status='RED' and s.reason='critical loop has zero fresh closed-loop stage evidence')
    ),
    jsonb_build_object('fingerprint','powerhouse-loop-assurance-v2','receipt_sync','canonical-runtime-and-cron-only'),
    case when count(*) filter (where s.status='RED')>0 then 'error'
         when count(*) filter (where s.status='AMBER')>0 then 'observed'
         else 'closed' end,
    p_now,p_now
  from public.powerhouse_loop_assurance_state_v1 s
  on conflict (dedupe_key) do update
    set evidence=excluded.evidence, context=excluded.context, state=excluded.state,
        occurred_at=excluded.occurred_at, updated_at=excluded.updated_at;
end;
$$;

create or replace view public.powerhouse_loop_integrity_health_v1 as
select
  now() as observed_at,
  count(*)::integer as total_loops,
  count(*) filter (where status='GREEN')::integer as green_loops,
  count(*) filter (where status='AMBER')::integer as amber_loops,
  count(*) filter (where status='RED')::integer as red_loops,
  count(*) filter (where fresh_stage_count=required_stage_count)::integer as fully_evidenced_loops,
  count(*) filter (where fresh_stage_count=0)::integer as zero_stage_evidence_loops,
  min(next_expected_at) as next_expected_at,
  max(checked_at) as last_assurance_check_at,
  case
    when count(*) filter (where status='RED')>0 then 'RED'
    when count(*) filter (where status='AMBER')>0 then 'AMBER'
    else 'GREEN'
  end as overall_status
from public.powerhouse_loop_assurance_state_v1;

revoke all on function public.powerhouse_sync_loop_assurance_receipts_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_sync_loop_assurance_receipts_v1(timestamptz) to service_role;
revoke all on function public.powerhouse_refresh_loop_assurance_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_loop_assurance_v1(timestamptz) to service_role;
