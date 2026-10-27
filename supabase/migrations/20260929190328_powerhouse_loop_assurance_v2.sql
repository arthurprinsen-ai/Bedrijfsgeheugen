-- Powerhouse Loop Assurance v2
-- Canonical meta-loop that continuously proves closed-loop integrity over existing runtime truth.

create table if not exists public.powerhouse_loop_assurance_registry_v1 (
  loop_key text primary key,
  label text not null,
  runtime_source text,
  cron_jobname text,
  expected_cadence_minutes integer not null check (expected_cadence_minutes > 0),
  critical boolean not null default true,
  required_stages text[] not null default array['input','decision','action','readback','outcome','measurement','learning','guard']::text[],
  active boolean not null default true,
  evidence_contract jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_loop_assurance_receipts_v1 (
  loop_key text not null references public.powerhouse_loop_assurance_registry_v1(loop_key) on delete cascade,
  stage text not null check (stage in ('input','decision','action','readback','outcome','measurement','learning','guard')),
  observed_at timestamptz not null,
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (loop_key, stage)
);

create table if not exists public.powerhouse_loop_assurance_state_v1 (
  loop_key text primary key references public.powerhouse_loop_assurance_registry_v1(loop_key) on delete cascade,
  status text not null check (status in ('GREEN','AMBER','RED')),
  last_runtime_at timestamptz,
  scheduler_active boolean,
  fresh_stage_count integer not null default 0,
  required_stage_count integer not null default 0,
  missing_stages text[] not null default '{}'::text[],
  next_expected_at timestamptz,
  reason text not null,
  checked_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb
);

alter table public.powerhouse_loop_assurance_registry_v1 enable row level security;
alter table public.powerhouse_loop_assurance_receipts_v1 enable row level security;
alter table public.powerhouse_loop_assurance_state_v1 enable row level security;

revoke all on public.powerhouse_loop_assurance_registry_v1 from anon, authenticated;
revoke all on public.powerhouse_loop_assurance_receipts_v1 from anon, authenticated;
revoke all on public.powerhouse_loop_assurance_state_v1 from anon, authenticated;

create or replace function public.powerhouse_record_loop_stage_v1(
  p_loop_key text,
  p_stage text,
  p_evidence jsonb default '{}'::jsonb,
  p_observed_at timestamptz default now()
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_stage not in ('input','decision','action','readback','outcome','measurement','learning','guard') then
    raise exception 'invalid loop assurance stage: %', p_stage;
  end if;

  insert into public.powerhouse_loop_assurance_receipts_v1(loop_key,stage,observed_at,evidence,updated_at)
  values (p_loop_key,p_stage,p_observed_at,coalesce(p_evidence,'{}'::jsonb),now())
  on conflict (loop_key,stage) do update
    set observed_at = greatest(powerhouse_loop_assurance_receipts_v1.observed_at, excluded.observed_at),
        evidence = excluded.evidence,
        updated_at = now();
end;
$$;

revoke all on function public.powerhouse_record_loop_stage_v1(text,text,jsonb,timestamptz) from public, anon, authenticated;

create or replace function public.powerhouse_refresh_loop_assurance_v1(p_now timestamptz default now())
returns table(out_loop_key text, out_status text, out_reason text)
language plpgsql
security definer
set search_path = public, extensions, cron
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
        'critical',r.critical
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
      'red',count(*) filter (where s.status='RED')
    ),
    jsonb_build_object('fingerprint','powerhouse-loop-assurance-v2'),
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

revoke all on function public.powerhouse_refresh_loop_assurance_v1(timestamptz) from public, anon, authenticated;

insert into public.powerhouse_loop_assurance_registry_v1
(loop_key,label,runtime_source,cron_jobname,expected_cadence_minutes,critical,evidence_contract)
values
('full-cycle-production-proof','Full cycle production proof','powerhouse_full_cycle_production_proof','powerhouse-full-cycle-proof-hourly-v1',60,true,'{"authority":"runtime + cron + stage receipts"}'),
('data-spine-watchdog','Data spine watchdog','powerhouse-data-spine','powerhouse-data-spine-watchdog-v1',10,true,'{"authority":"runtime + cron + stage receipts"}'),
('one-brain-reconcile','One Brain reconciliation',null,'powerhouse-one-brain-reconcile-v1',10,true,'{"authority":"cron + stage receipts"}'),
('execution-resilience','Execution resilience watchdog',null,'powerhouse-execution-resilience-watchdog-v1',1,true,'{"authority":"cron + stage receipts"}'),
('content-closed-loop','Content closed loop',null,'powerhouse-content-closed-loop-v1',5,true,'{"authority":"cron + stage receipts"}'),
('daily-compound-learning','Daily compound learning','powerhouse-daily-compound-learning-v1','powerhouse-daily-compound-learning-v1',1440,true,'{"authority":"runtime + cron + stage receipts"}'),
('revenue-flywheel','Revenue flywheel','powerhouse_revenue_flywheel_v1','powerhouse-revenue-flywheel-health-v1',60,true,'{"authority":"runtime + cron + stage receipts"}'),
('autonomous-outreach','Autonomous outreach',null,'powerhouse-autonomous-outreach-dispatch-daily',1440,true,'{"authority":"cron + stage receipts"}'),
('social-publisher','Social publisher','powerhouse-social-publisher',null,1440,true,'{"authority":"runtime + stage receipts"}'),
('seo-opportunity-resolver','SEO opportunity resolver',null,'powerhouse-seo-opportunity-resolver-daily',1440,false,'{"authority":"cron + stage receipts"}'),
('mira-problem-loop','Mira problem radar/outcome loop',null,'powerhouse-mira-problem-radar-v1',1440,false,'{"authority":"cron + stage receipts"}'),
('self-improvement-layer','Self improvement layer','powerhouse-self-improvement-layer.v1','powerhouse-self-improvement-layer-v1',1440,true,'{"authority":"runtime + cron + stage receipts"}')
on conflict (loop_key) do update set
  label=excluded.label,
  runtime_source=excluded.runtime_source,
  cron_jobname=excluded.cron_jobname,
  expected_cadence_minutes=excluded.expected_cadence_minutes,
  critical=excluded.critical,
  evidence_contract=excluded.evidence_contract,
  active=true,
  updated_at=now();

do $$
declare v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname='powerhouse-loop-assurance-v2' limit 1;
  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
  perform cron.schedule(
    'powerhouse-loop-assurance-v2',
    '*/5 * * * *',
    'select public.powerhouse_refresh_loop_assurance_v1(now());'
  );
end;
$$;

select * from public.powerhouse_refresh_loop_assurance_v1(now());
