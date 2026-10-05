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
    select * from public.powerhouse_loop_assurance_registry_v1
    where active=true order by loop_key
  loop
    v_window := make_interval(mins => r.expected_cadence_minutes * 2);

    if r.runtime_source is null then
      v_last_runtime := null;
    else
      select max(e.occurred_at) into v_last_runtime
      from public.powerhouse_runtime_events e
      where e.source=r.runtime_source;
    end if;

    if r.cron_jobname is null then
      v_scheduler_active := null;
    else
      select coalesce(bool_or(j.active),false) into v_scheduler_active
      from cron.job j where j.jobname=r.cron_jobname;
    end if;

    select cardinality(r.required_stages),
           count(*) filter (where rr.observed_at >= p_now-v_window),
           coalesce(array_agg(s.stage order by s.stage)
             filter (where rr.observed_at is null or rr.observed_at < p_now-v_window),'{}'::text[])
    into v_required_count,v_fresh_stage_count,v_missing_stages
    from unnest(r.required_stages) s(stage)
    left join public.powerhouse_loop_assurance_receipts_v1 rr
      on rr.loop_key=r.loop_key and rr.stage=s.stage;

    if r.cron_jobname is not null and coalesce(v_scheduler_active,false)=false then
      v_status:='RED'; v_reason:='scheduler missing or inactive';
    elsif r.runtime_source is not null and v_last_runtime is null then
      v_status:='RED'; v_reason:='no runtime evidence';
    elsif r.runtime_source is not null and v_last_runtime < p_now-v_window then
      v_status:='RED'; v_reason:='runtime evidence stale beyond 2x cadence';
    elsif v_fresh_stage_count=0 and r.critical then
      v_status:='RED'; v_reason:='critical loop has zero fresh closed-loop stage evidence';
    elsif v_fresh_stage_count<v_required_count then
      v_status:='AMBER'; v_reason:='closed-loop stage evidence incomplete or stale';
    elsif r.runtime_source is not null and v_last_runtime < p_now-make_interval(mins=>r.expected_cadence_minutes) then
      v_status:='AMBER'; v_reason:='runtime evidence older than expected cadence';
    else
      v_status:='GREEN'; v_reason:='scheduler/runtime/stage evidence current';
    end if;

    v_next_expected := case
      when v_last_runtime is not null then v_last_runtime+make_interval(mins=>r.expected_cadence_minutes)
      else p_now+make_interval(mins=>r.expected_cadence_minutes)
    end;

    insert into public.powerhouse_loop_assurance_state_v1(
      loop_key,status,last_runtime_at,scheduler_active,fresh_stage_count,required_stage_count,
      missing_stages,next_expected_at,reason,checked_at,evidence
    ) values (
      r.loop_key,v_status,v_last_runtime,v_scheduler_active,v_fresh_stage_count,v_required_count,
      v_missing_stages,v_next_expected,v_reason,p_now,
      jsonb_build_object(
        'runtime_source',r.runtime_source,'cron_jobname',r.cron_jobname,
        'expected_cadence_minutes',r.expected_cadence_minutes,'critical',r.critical,
        'receipt_sync','canonical-runtime-and-cron-only'
      )
    )
    on conflict on constraint powerhouse_loop_assurance_state_v1_pkey do update set
      status=excluded.status,last_runtime_at=excluded.last_runtime_at,
      scheduler_active=excluded.scheduler_active,fresh_stage_count=excluded.fresh_stage_count,
      required_stage_count=excluded.required_stage_count,missing_stages=excluded.missing_stages,
      next_expected_at=excluded.next_expected_at,reason=excluded.reason,
      checked_at=excluded.checked_at,evidence=excluded.evidence;

    insert into public.brain_obligations(
      obligation_type,capability_id,business_entity,business_period,business_timezone,
      payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version
    ) values (
      'OPERATIONS_ASSURANCE',r.loop_key,'powerhouse-loop-assurance-v2','continuous',
      'Europe/Amsterdam',md5(r.loop_key),'powerhouse-loop-assurance-v2','Powerhouse',
      case when v_status='GREEN' then 'FULFILLED' else 'OPEN' end,
      jsonb_build_object(
        'assurance_status',v_status,'reason',v_reason,'missing_stages',v_missing_stages,
        'last_runtime_at',v_last_runtime,'next_expected_at',v_next_expected,'checked_at',p_now
      ),
      p_now,p_now,1
    )
    on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
    do update set
      state=excluded.state,
      evidence=excluded.evidence,
      updated_at=excluded.updated_at,
      version=public.brain_obligations.version+1;

    out_loop_key:=r.loop_key; out_status:=v_status; out_reason:=v_reason;
    return next;
  end loop;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,created_at,updated_at
  )
  select
    'loop-assurance:'||to_char(date_trunc('minute',p_now),'YYYYMMDDHH24MI'),
    'loop_assurance_refresh','powerhouse-loop-assurance-v2','all-active-loops','internal',p_now,
    jsonb_build_object(
      'green',count(*) filter(where s.status='GREEN'),
      'amber',count(*) filter(where s.status='AMBER'),
      'red',count(*) filter(where s.status='RED'),
      'zero_receipt_critical',count(*) filter(where s.status='RED' and s.reason='critical loop has zero fresh closed-loop stage evidence')
    ),
    jsonb_build_object('fingerprint','powerhouse-loop-assurance-v2','receipt_sync','canonical-runtime-and-cron-only'),
    case when count(*) filter(where s.status='RED')>0 then 'error'
         when count(*) filter(where s.status='AMBER')>0 then 'observed'
         else 'closed' end,
    p_now,p_now
  from public.powerhouse_loop_assurance_state_v1 s
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,context=excluded.context,state=excluded.state,
    occurred_at=excluded.occurred_at,updated_at=excluded.updated_at;
end;
$$;
