create or replace function public.powerhouse_sync_loop_assurance_receipts_v1(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  r record;
  v_window interval;
  v_event_type text;
  v_event_state text;
  v_event_occurred_at timestamptz;
  v_event_subject_key text;
  v_cron_status text;
  v_cron_start_time timestamptz;
  v_cron_end_time timestamptz;
  v_written integer := 0;
begin
  for r in
    select *
    from public.powerhouse_loop_assurance_registry_v1
    where active = true
    order by loop_key
  loop
    v_window := make_interval(mins => greatest(r.expected_cadence_minutes * 2, 10));

    v_event_type := null;
    v_event_state := null;
    v_event_occurred_at := null;
    v_event_subject_key := null;

    if r.runtime_source is not null then
      select e.event_type,e.state,e.occurred_at,e.subject_key
      into v_event_type,v_event_state,v_event_occurred_at,v_event_subject_key
      from public.powerhouse_runtime_events e
      where e.source = r.runtime_source
        and e.occurred_at >= p_now - v_window
      order by e.occurred_at desc, e.updated_at desc
      limit 1;
    end if;

    v_cron_status := null;
    v_cron_start_time := null;
    v_cron_end_time := null;

    if r.cron_jobname is not null then
      select d.status,d.start_time,d.end_time
      into v_cron_status,v_cron_start_time,v_cron_end_time
      from cron.job_run_details d
      join cron.job j on j.jobid=d.jobid
      where j.jobname=r.cron_jobname
        and d.start_time >= p_now - v_window
      order by d.start_time desc
      limit 1;
    end if;

    if v_cron_start_time is not null then
      insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
      values (
        r.loop_key,'input',v_cron_start_time,
        jsonb_build_object('evidence_type','cron_invocation','job',r.cron_jobname,'status',v_cron_status,'start_time',v_cron_start_time,'end_time',v_cron_end_time),
        p_now
      )
      on conflict (loop_key,stage) do update
        set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
      where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
      v_written := v_written + 1;

      if lower(coalesce(v_cron_status,'')) = 'succeeded' then
        insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
        values (
          r.loop_key,'decision',coalesce(v_cron_end_time,v_cron_start_time),
          jsonb_build_object('evidence_type','scheduled_policy_execution','job',r.cron_jobname,'status',v_cron_status),
          p_now
        )
        on conflict (loop_key,stage) do update
          set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
        where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
        v_written := v_written + 1;
      end if;
    end if;

    if v_event_occurred_at is not null then
      insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
      values (
        r.loop_key,'readback',v_event_occurred_at,
        jsonb_build_object('evidence_type','runtime_event','source',r.runtime_source,'event_type',v_event_type,'state',v_event_state,'subject_key',v_event_subject_key),
        p_now
      )
      on conflict (loop_key,stage) do update
        set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
      where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
      v_written := v_written + 1;

      insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
      values (
        r.loop_key,'measurement',v_event_occurred_at,
        jsonb_build_object('evidence_type','runtime_observation','source',r.runtime_source,'event_type',v_event_type,'state',v_event_state),
        p_now
      )
      on conflict (loop_key,stage) do update
        set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
      where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
      v_written := v_written + 1;

      if lower(coalesce(v_event_state,'')) in ('actioned','closed') then
        insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
        values (
          r.loop_key,'action',v_event_occurred_at,
          jsonb_build_object('evidence_type','runtime_action','source',r.runtime_source,'event_type',v_event_type,'state',v_event_state),
          p_now
        )
        on conflict (loop_key,stage) do update
          set observed_at=excluded.observed_at,evidence=excluded.evidence,updated_at=excluded.updated_at
        where public.powerhouse_loop_assurance_receipts_v1.observed_at <= excluded.observed_at;
        v_written := v_written + 1;
      end if;

      if lower(coalesce(v_event_state,'')) = 'closed' then
        insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
        values (
          r.loop_key,'outcome',v_event_occurred_at,
          jsonb_build_object('evidence_type','runtime_closed_outcome','source',r.runtime_source,'event_type',v_event_type,'state',v_event_state),
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
