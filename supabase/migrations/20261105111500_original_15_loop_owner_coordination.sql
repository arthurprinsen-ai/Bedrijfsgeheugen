-- Existing Powerhouse 15-loop authority, existing Brain obligations + Portal readback.
-- Correct generic owner='Powerhouse' overwritten on every native assurance refresh.
-- No new executor, scheduler, authority, table or provider side effect.
begin;
-- Native PR previews replay the 804 source migrations but can lack two
-- historical registry data mutations that are already canonical in production.
-- Repair EXACT retired/approved loop keys only, not a second social publisher.
-- The retire operation changes a monitoring registry entry, NOT cron/Meta state.
update public.powerhouse_loop_assurance_registry_v1 r
set active=false,
    evidence_contract=coalesce(r.evidence_contract,'{}'::jsonb)
      ||jsonb_build_object(
        'authority','content-closed-loop',
        'lifecycle','RETIRED',
        'superseded_by','content-closed-loop',
        'retired_at','2026-10-07T15:55:15.462503+00:00',
        'retired_reason','standalone social publisher assurance consolidated into canonical content closed loop'),
    updated_at=now()
where r.loop_key='social-publisher'
  and r.active=true
  and r.runtime_source='powerhouse-social-publisher'
  and r.cron_jobname is null
  and coalesce(r.evidence_contract->>'authority','') in ('runtime + stage receipts','content-closed-loop');

-- Existing canonical Portal visual assurance is already active in production;
-- supply only that missing original registry identity to an isolated preview.
-- Stage receipts and visual proof must still be independently observed.
insert into public.powerhouse_loop_assurance_registry_v1
 (loop_key,label,runtime_source,cron_jobname,expected_cadence_minutes,
  critical,required_stages,active,evidence_contract)
values (
 'portal-visual-density','Portal visual density regression',
 null,'powerhouse-portal-visual-assurance-sync-v1',1440,true,
 array['input','decision','action','readback','outcome','measurement','learning','guard'],
 true,
 jsonb_build_object(
   'authority','GitHub screenshot regression + Supabase loop assurance + Notion verified state',
   'fingerprint','portal-visual-density-oversized-responsive-cascade-v1',
   'viewports',jsonb_build_array('1440x900','1024x768','390x844'),
   'no_parallel_truth',true,
   'guard_requires_pass',true,
   'runtime_authority','external GitHub Actions visual evidence via explicit Powerhouse stage receipts',
   'production_routes',jsonb_build_array('/portal-v2/?page=overview','/portal-v2/?page=csrd-impact','/portal-v2/?page=data-ai')
 )
)
on conflict (loop_key) do nothing;

do $guard$ begin
  if exists (select 1 from public.powerhouse_loop_assurance_registry_v1
      where loop_key='social-publisher' and active=true)
    or not exists(select 1 from public.powerhouse_loop_assurance_registry_v1
      where loop_key='portal-visual-density' and active=true)
    then raise exception 'ORIGINAL_RETIRED_PUBLISHER_AND_PORTAL_REGISTRY_MISMATCH';
  end if;
  if (select count(*) from public.powerhouse_loop_assurance_registry_v1 where active) <> 15
    then raise exception 'ORIGINAL_15_LOOP_POPULATION_CHANGED_FAIL_CLOSED';
  end if;
end $guard$;

update public.powerhouse_loop_assurance_registry_v1 r
set evidence_contract=coalesce(r.evidence_contract,'{}'::jsonb)
  ||jsonb_build_object('recovery_owner',route.owner,'recovery_action',route.action),
  updated_at=now()
from (values
  ('autonomous-outreach','powerhouse-autonomous-outreach-dispatch-daily','VERIFY_AUTHORIZED_OUTREACH_ACTION_PROVIDER_RECEIPT'),
  ('content-closed-loop','powerhouse-content-loop','RECONCILE_ORIGINAL_CHANNEL_PROVIDER_PROOF'),
  ('daily-compound-learning','powerhouse-daily-compound-learning-v1','EVALUATE_APPLIED_LEARNING_WITH_REAL_OUTCOMES'),
  ('data-spine-watchdog','powerhouse-runtime-scheduler-mux-v1 / data-spine-watchdog','REPAIR_SOURCE_FRESHNESS_AND_EFFECT_LINK'),
  ('execution-resilience','powerhouse-runtime-scheduler-mux-v1 / execution-resilience-watchdog','RECONCILE_ORIGINAL_STALE_OPERATIONS'),
  ('external-intelligence-universe','powerhouse-external-intelligence-universe-v1','VERIFY_EXTERNAL_SIGNAL_TO_ACTION_OUTCOME'),
  ('full-cycle-production-proof','powerhouse-full-cycle-proof-hourly-v1','RECONCILE_INDEPENDENT_PRODUCTION_PROOF'),
  ('mira-problem-loop','powerhouse-mira-problem-radar-v1','VERIFY_ORIGINAL_MIRA_SOURCE_AND_PROVIDER_RESULT'),
  ('one-brain-reconcile','powerhouse-runtime-scheduler-mux-v1 / reconciliation-worker','RESOLVE_ORIGINAL_BRAIN_PROVIDER_OUTCOME'),
  ('portal-visual-density','powerhouse-portal-visual-assurance-sync-v1','VERIFY_ORIGINAL_MOBILE_BROWSER_RECEIPT'),
  ('revenue-flywheel','powerhouse-revenue-flywheel-health-v1','CALIBRATE_DUE_FORECASTS_WITH_VERIFIED_OUTCOMES'),
  ('self-improvement-layer','powerhouse-self-improvement-layer-v1','MEASURE_APPLIED_ORIGINAL_IMPROVEMENT'),
  ('seo-opportunity-resolver','powerhouse-seo-opportunity-resolver-daily','VERIFY_ORIGINAL_SEARCH_OPTIMIZATION_OUTCOME'),
  ('signal-taxonomy-self-heal','postgres-trigger:trg_bg_externe_signalen_ensure_onderwerp_v1','VERIFY_ORIGINAL_SIGNAL_TAXONOMY_CORRELATION'),
  -- Old preview migration lineage can still list the retired standalone publisher
  -- as active. Assign it only to the SAME canonical content owner; never
  -- enable, dispatch, schedule, or create a second social-publishing system.
  ('social-publisher','powerhouse-content-loop','VERIFY_RETIRED_ORIGINAL_SOCIAL_PUBLISHER_OWNER'),
  ('source-backed-outbound','powerhouse-outbound-source-lineage-hourly-v1','VERIFY_AUTHORIZED_SOURCE_BACKED_OUTBOUND')
) as route(loop_key,owner,action)
where r.loop_key=route.loop_key and r.active=true;

do $guard$ begin
  if (select count(*) from public.powerhouse_loop_assurance_registry_v1
      where active and (nullif(evidence_contract->>'recovery_owner','') is null
        or nullif(evidence_contract->>'recovery_action','') is null)) <> 0
    then raise exception 'ORIGINAL_LOOP_RECOVERY_ROUTE_MISSING';
  end if;
end $guard$;

create or replace function public.powerhouse_refresh_loop_assurance_v1(p_now timestamptz default now())
returns table(out_loop_key text,out_status text,out_reason text)
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
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
  v_guard_pass boolean;
  v_recovery_owner text;
  v_recovery_action text;
begin
  perform public.powerhouse_sync_loop_assurance_receipts_v1(p_now);

  for r in
    select * from public.powerhouse_loop_assurance_registry_v1
    where active=true order by loop_key
  loop
    v_window := make_interval(mins => r.expected_cadence_minutes * 2);
    -- Routing belongs to the existing registry, NOT an invented second agent.
    v_recovery_owner := coalesce(nullif(r.evidence_contract->>'recovery_owner',''),'Powerhouse');
    v_recovery_action := coalesce(nullif(r.evidence_contract->>'recovery_action',''),
      'VERIFY_ORIGINAL_LOOP_OWNER_AND_RECEIPTS');

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

    select case
             when rr.observed_at >= p_now-v_window and rr.evidence ? 'pass'
             then (rr.evidence->>'pass')::boolean
             else null
           end
    into v_guard_pass
    from public.powerhouse_loop_assurance_receipts_v1 rr
    where rr.loop_key=r.loop_key and rr.stage='guard'
    limit 1;

    if r.cron_jobname is not null and coalesce(v_scheduler_active,false)=false then
      v_status:='RED'; v_reason:='scheduler missing or inactive';
    elsif r.runtime_source is not null and v_last_runtime is null then
      v_status:='RED'; v_reason:='no runtime evidence';
    elsif r.runtime_source is not null and v_last_runtime < p_now-v_window then
      v_status:='RED'; v_reason:='runtime evidence stale beyond 2x cadence';
    elsif v_guard_pass is false then
      v_status:='RED'; v_reason:='fresh guard evidence reports unresolved failure or human boundary';
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
        'guard_pass',v_guard_pass,
        'recovery_owner',v_recovery_owner,
        'recovery_action',case when v_status='GREEN' then 'ASSURANCE_NO_REPAIR_REQUIRED' else v_recovery_action end,
        'recovery_owner_registered',r.evidence_contract ? 'recovery_owner',
        'receipt_sync','canonical-runtime-cron-and-explicit-guard'
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
      'Europe/Amsterdam',md5(r.loop_key),'powerhouse-loop-assurance-v2',v_recovery_owner,
      case when v_status='GREEN' then 'FULFILLED' else 'OPEN' end,
      jsonb_build_object(
        'assurance_status',v_status,'reason',v_reason,'missing_stages',v_missing_stages,
        'guard_pass',v_guard_pass,
        'recovery_owner',v_recovery_owner,
        'recovery_action',case when v_status='GREEN' then 'ASSURANCE_NO_REPAIR_REQUIRED' else v_recovery_action end,
        'recovery_owner_registered',r.evidence_contract ? 'recovery_owner',
        'last_runtime_at',v_last_runtime,'next_expected_at',v_next_expected,'checked_at',p_now
      ),
      p_now,p_now,1
    )
    on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
    do update set
      state=excluded.state,owner=excluded.owner,evidence=excluded.evidence,updated_at=excluded.updated_at,
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
      'red',count(*) filter(where s.status='RED')
    ),
    jsonb_build_object('fingerprint','powerhouse-loop-assurance-v2','receipt_sync','canonical-runtime-cron-and-explicit-guard'),
    case when count(*) filter(where s.status='RED')>0 then 'error'
         when count(*) filter(where s.status='AMBER')>0 then 'observed'
         else 'closed' end,
    p_now,p_now
  from public.powerhouse_loop_assurance_state_v1 s
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,context=excluded.context,state=excluded.state,
    occurred_at=excluded.occurred_at,updated_at=excluded.updated_at;
end;
$function$;

-- Retain original service-only authority, never grant public EXECUTE to definer.
revoke all on function public.powerhouse_refresh_loop_assurance_v1(timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_loop_assurance_v1(timestamptz)
  to service_role;
commit;
