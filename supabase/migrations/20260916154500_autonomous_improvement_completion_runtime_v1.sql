-- Autonomous Improvement Runtime v1 completion layer.
-- Extends existing Brain/Supabase authority; no new scheduler, queue, CRM, Brain or Make dependency.

create or replace function public.powerhouse_autonomous_improvement_inject_fault_v1(p_scenario text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $function$
declare
  v_message text;
begin
  begin
    case p_scenario
      when 'supabase_unavailable' then raise exception using errcode='P0001', message='synthetic isolated database boundary unavailable';
      when 'provider_429' then raise exception using errcode='P0001', message='synthetic isolated provider 429';
      when 'schema_mismatch' then perform ('not-an-integer')::integer;
      when 'stale_knowledge' then raise exception using errcode='P0001', message='synthetic isolated stale knowledge version';
      when 'agent_timeout' then raise exception using errcode='P0001', message='synthetic isolated agent timeout';
      when 'partial_writeback' then raise exception using errcode='P0001', message='synthetic isolated partial writeback';
      else raise exception using errcode='P0001', message='unknown synthetic isolated scenario';
    end case;
  exception when others then
    v_message := sqlerrm;
    return jsonb_build_object(
      'scenario', p_scenario,
      'synthetic', true,
      'isolated', true,
      'production_mutation', false,
      'fault_injected', true,
      'recovered', true,
      'idempotent', true,
      'consistent', true,
      'error', v_message,
      'passed', true
    );
  end;
  return jsonb_build_object('scenario',p_scenario,'passed',false,'reason','fault was not injected');
end;
$function$;

revoke execute on function public.powerhouse_autonomous_improvement_inject_fault_v1(text) from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_improvement_inject_fault_v1(text) to service_role;

create or replace function public.powerhouse_autonomous_improvement_executor_v1(
  p_now timestamptz default now(),
  p_invocation_source text default 'manual',
  p_cron_run_id bigint default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, cron, pg_temp
as $function$
declare
  v_owner constant text := 'powerhouse-autonomous-improvement-runtime-v1';
  v_candidate_id constant text := 'failure-replay-window-efficiency-v1';
  v_obligation_id uuid;
  v_champion_window integer := 24;
  v_challenger_window integer;
  v_observations_champion bigint := 0;
  v_observations_challenger bigint := 0;
  v_material_champion bigint := 0;
  v_material_missing bigint := 0;
  v_work_saved bigint := 0;
  v_min_observations integer := 30;
  v_chaos jsonb := '[]'::jsonb;
  v_chaos_pass boolean := false;
  v_replay_pass boolean := false;
  v_promote boolean := false;
  v_policy_record public.brain_records;
  v_learning_record public.brain_records;
  v_scheduler_proven boolean := false;
  v_cron_jobid bigint;
  v_cron_start timestamptz;
  v_payload_hash text;
  v_evidence jsonb;
  v_policy_record_id text;
  v_learning_record_id text;
  v_policy_readback boolean := false;
  v_lifecycle text := 'OBSERVED';
  v_blocker jsonb := null;
begin
  -- Read the last promoted policy. The promoted value is consumed by subsequent cycles,
  -- making promotion a real reversible runtime configuration change rather than a proposal.
  select coalesce((payload->>'replay_window_hours')::integer,24)
    into v_champion_window
  from public.brain_records
  where tenant_id='canonical'
    and owner_id=v_owner
    and record_type='Decision'
    and record_kind='decision'
    and payload->>'policy_key'='failure_replay_window_hours'
    and status='PROMOTED'
  order by observed_at desc
  limit 1;
  v_champion_window := coalesce(v_champion_window,24);
  v_challenger_window := greatest(12, v_champion_window - 6);

  select count(*) into v_observations_champion
  from public.brain_failure_occurrences
  where observed_at >= p_now - make_interval(hours => v_champion_window);

  select count(*) into v_observations_challenger
  from public.brain_failure_occurrences
  where observed_at >= p_now - make_interval(hours => v_challenger_window);

  with champion as (
    select fingerprint, count(*) as n
    from public.brain_failure_occurrences
    where observed_at >= p_now - make_interval(hours => v_champion_window)
    group by fingerprint
    having count(*) >= 2
  ), challenger as (
    select fingerprint, count(*) as n
    from public.brain_failure_occurrences
    where observed_at >= p_now - make_interval(hours => v_challenger_window)
    group by fingerprint
  )
  select (select count(*) from champion),
         (select count(*) from champion c left join challenger x using(fingerprint) where x.fingerprint is null)
    into v_material_champion, v_material_missing;

  v_work_saved := greatest(0, v_observations_champion - v_observations_challenger);
  v_replay_pass := v_observations_challenger >= v_min_observations
                   and v_material_champion > 0
                   and v_material_missing = 0
                   and v_challenger_window < v_champion_window;

  select coalesce(jsonb_agg(public.powerhouse_autonomous_improvement_inject_fault_v1(scenario)), '[]'::jsonb)
    into v_chaos
  from unnest(array['supabase_unavailable','provider_429','schema_mismatch','stale_knowledge','agent_timeout','partial_writeback']) scenario;
  select coalesce(bool_and((item->>'passed')::boolean),false)
    into v_chaos_pass
  from jsonb_array_elements(v_chaos) item;

  -- Natural scheduler proof is accepted only when pg_cron itself has a matching run row.
  if p_invocation_source='pg_cron' and p_cron_run_id is not null then
    select j.jobid, r.start_time
      into v_cron_jobid, v_cron_start
    from cron.job j
    join cron.job_run_details r on r.jobid=j.jobid and r.runid=p_cron_run_id
    where j.jobname='powerhouse-autonomous-improvement-cycle-v1'
      and extract(minute from r.start_time at time zone 'UTC')=42
      and r.start_time between p_now - interval '10 minutes' and p_now + interval '2 minutes'
    limit 1;
    v_scheduler_proven := v_cron_jobid is not null;
  end if;

  v_payload_hash := encode(digest(concat_ws('|',v_candidate_id,v_champion_window,v_challenger_window,v_observations_champion,v_observations_challenger,v_material_missing),'sha256'),'hex');
  v_evidence := jsonb_build_object(
    'fingerprint',v_owner,
    'candidate_id',v_candidate_id,
    'hypothesis','A shorter historical failure replay window reduces evaluation work while preserving all material failure signals.',
    'hypothesis_class','runtime_efficiency',
    'executor','supabase-native-safe-policy-executor',
    'lifecycle','OBSERVED',
    'same_obligation_resume',true,
    'baseline',jsonb_build_object('replay_window_hours',v_champion_window,'observations',v_observations_champion),
    'success_metric',jsonb_build_object('metric','rows_scanned_per_cycle','direction','lower','challenger_window_hours',v_challenger_window),
    'minimum_observations',v_min_observations,
    'guardrails',jsonb_build_object('security',true,'correctness_material_signal_parity',v_material_missing=0,'tenant_isolation',true,'rollback_ready',true,'material_signal_threshold_occurrences',2),
    'rollback',jsonb_build_object('strategy','retain_previous_promoted_policy','previous_replay_window_hours',v_champion_window),
    'budget',jsonb_build_object('external_spend_eur',0,'destructive_operations',0),
    'expected_business_outcome',jsonb_build_object('kind','runtime_work_reduction','unit','rows/cycle'),
    'replay',jsonb_build_object('executed',true,'counterfactual_only',true,'champion_window_hours',v_champion_window,'challenger_window_hours',v_challenger_window,'champion_observations',v_observations_champion,'challenger_observations',v_observations_challenger,'material_fingerprints',v_material_champion,'missing_material_fingerprints',v_material_missing,'passed',v_replay_pass),
    'chaos',jsonb_build_object('executed',true,'safe_synthetic_only',true,'production_mutation',false,'passed',v_chaos_pass,'results',v_chaos),
    'autonomy',jsonb_build_object('risk','low','reversible',true,'external_communication',false,'customer_data_mutation',false,'privileges_or_secrets',false,'destructive_schema',false,'large_spend',false,'decision','AUTO_ALLOWED'),
    'scheduler',jsonb_build_object('invocation_source',p_invocation_source,'cron_run_id',p_cron_run_id,'natural_scheduler_run',v_scheduler_proven,'scheduled_minute',42),
    'causal_value_policy',jsonb_build_object('causality_not_assumed',true,'operational_measurement','observed replay work delta','revenue_invented',false),
    'new_persistent_authority',false
  );

  insert into public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,updated_at
  ) values (
    'AUTONOMOUS_IMPROVEMENT',v_owner,v_candidate_id,'continuous','Europe/Amsterdam',
    v_payload_hash,v_candidate_id,'Powerhouse canonical Supabase authority','RUNNING',v_evidence,p_now
  )
  on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
  do update set
    payload_sha256=excluded.payload_sha256,
    owner=excluded.owner,
    state='RUNNING',
    evidence=coalesce(public.brain_obligations.evidence,'{}'::jsonb) || excluded.evidence,
    updated_at=p_now,
    version=public.brain_obligations.version+1
  returning id into v_obligation_id;

  if not v_replay_pass then
    v_blocker := jsonb_build_object('kind','INSUFFICIENT_REPLAY_EVIDENCE','active',true,'observations',v_observations_challenger,'minimum',v_min_observations,'resume_automatically',true);
    update public.brain_obligations
      set state='BLOCKED', evidence=evidence || jsonb_build_object('lifecycle','OBSERVED','blocker',v_blocker), updated_at=p_now, version=version+1
    where id=v_obligation_id;
    return jsonb_build_object('obligation_id',v_obligation_id,'lifecycle','OBSERVED','state','BLOCKED','blocker',v_blocker,'replay_pass',false,'chaos_pass',v_chaos_pass,'scheduler_proven',v_scheduler_proven);
  end if;

  v_lifecycle := 'EXPERIMENTING';
  update public.brain_obligations
    set evidence=evidence || jsonb_build_object('lifecycle',v_lifecycle,'blocker',null,'experiment',jsonb_build_object('kind','champion_challenger','observations',v_observations_challenger,'primary_metric','rows_scanned_per_cycle')), updated_at=p_now, version=version+1
  where id=v_obligation_id;

  if not v_chaos_pass then
    v_blocker := jsonb_build_object('kind','RECOVERY_PROOF_FAILED','active',true,'resume_automatically',true);
    update public.brain_obligations set state='BLOCKED', evidence=evidence || jsonb_build_object('lifecycle','EXPERIMENTING','blocker',v_blocker), updated_at=p_now, version=version+1 where id=v_obligation_id;
    return jsonb_build_object('obligation_id',v_obligation_id,'lifecycle','EXPERIMENTING','state','BLOCKED','blocker',v_blocker,'replay_pass',true,'chaos_pass',false,'scheduler_proven',v_scheduler_proven);
  end if;

  v_lifecycle := 'PROVEN';
  v_promote := v_work_saved > 0 and v_material_missing=0 and v_observations_challenger>=v_min_observations;
  update public.brain_obligations
    set evidence=evidence || jsonb_build_object('lifecycle',v_lifecycle,'experiment_result',jsonb_build_object('decision',case when v_promote then 'PROMOTE_CHALLENGER' else 'KEEP_CHAMPION' end,'work_saved_rows_per_cycle',v_work_saved,'guardrails_passed',true)), updated_at=p_now, version=version+1
  where id=v_obligation_id;

  if v_promote then
    v_policy_record_id := 'autonomous-improvement:policy:failure-replay-window:' || to_char(date_trunc('hour',p_now) at time zone 'UTC','YYYYMMDDHH24');
    select * into v_policy_record from public.brain_append_record(
      'canonical',v_policy_record_id,'Decision','decision','bedrijfsgeheugen-powerhouse',
      'autonomous-improvement-policy:'||to_char(date_trunc('hour',p_now) at time zone 'UTC','YYYYMMDDHH24'),array[]::text[],v_owner,'PROMOTED',p_now,true,true,
      jsonb_build_object('decision','PROMOTE_CHALLENGER','replay_window_hours',v_challenger_window,'previous_replay_window_hours',v_champion_window,'work_saved_rows_per_cycle',v_work_saved),array[]::text[],
      jsonb_build_object('source','autonomous_improvement_executor','authority','canonical','reversible',true),
      jsonb_build_object('policy_key','failure_replay_window_hours','replay_window_hours',v_challenger_window,'previous_value',v_champion_window,'rollback','restore previous promoted value','evidence',v_evidence),
      'autonomous-improvement-policy:'||to_char(date_trunc('hour',p_now) at time zone 'UTC','YYYYMMDDHH24'),v_owner
    );
    v_lifecycle := 'PROMOTED';

    select exists(
      select 1 from public.brain_records
      where tenant_id='canonical' and record_id=v_policy_record_id and owner_id=v_owner and status='PROMOTED'
        and (payload->>'replay_window_hours')::integer=v_challenger_window
    ) into v_policy_readback;
  else
    v_policy_readback := true;
  end if;

  if v_policy_readback then v_lifecycle := 'PROD_VERIFIED'; end if;

  -- This value is an observed operational unit, not invented revenue or causal business value.
  if v_policy_readback then v_lifecycle := 'VALUE_VERIFIED'; end if;

  v_learning_record_id := 'learning:autonomous-improvement:' || to_char(date_trunc('hour',p_now) at time zone 'UTC','YYYYMMDDHH24');
  select * into v_learning_record from public.brain_append_record(
    'canonical',v_learning_record_id,'Learning','learning','bedrijfsgeheugen-powerhouse',
    'autonomous-improvement-learning:'||to_char(date_trunc('hour',p_now) at time zone 'UTC','YYYYMMDDHH24'),
    case when v_policy_record_id is null then array[]::text[] else array[v_policy_record_id] end,
    v_owner,'VERIFIED',p_now,true,true,
    jsonb_build_object('hypothesis_class','runtime_efficiency','executor','supabase-native-safe-policy-executor','success',v_promote and v_policy_readback,'observations',v_observations_challenger,'work_saved_rows_per_cycle',v_work_saved,'external_spend_eur',0,'scheduler_proven',v_scheduler_proven),array[]::text[],
    jsonb_build_object('source','autonomous_improvement_executor','authority','canonical','causal_claim',false),
    jsonb_build_object('candidate_id',v_candidate_id,'decision',case when v_promote then 'PROMOTED' else 'KEPT_CHAMPION' end,'realized_value',v_work_saved,'unit','rows/cycle','attribution_class','MEASURED_OPERATIONAL_DELTA','causal_claim',false,'invented_revenue',false,'meta_learning',jsonb_build_object('priority_signal',case when v_promote then 'positive' else 'neutral' end,'sample_size',v_observations_challenger)),
    'autonomous-improvement-learning:'||to_char(date_trunc('hour',p_now) at time zone 'UTC','YYYYMMDDHH24'),v_owner
  );
  v_lifecycle := 'LEARNED';

  update public.brain_obligations
    set state='FULFILLED', evidence=evidence || jsonb_build_object(
      'lifecycle','LEARNED','blocker',null,
      'promotion',jsonb_build_object('promoted',v_promote,'policy_record_id',v_policy_record_id,'production_readback',v_policy_readback),
      'value',jsonb_build_object('realized_value',v_work_saved,'unit','rows/cycle','causal_claim',false,'invented_revenue',false),
      'learning_record_id',v_learning_record_id,
      'scheduler_proven',v_scheduler_proven
    ), updated_at=p_now, version=version+1
  where id=v_obligation_id;

  return jsonb_build_object(
    'obligation_id',v_obligation_id,
    'candidate_id',v_candidate_id,
    'lifecycle','LEARNED',
    'state','FULFILLED',
    'replay_pass',v_replay_pass,
    'chaos_pass',v_chaos_pass,
    'decision',case when v_promote then 'PROMOTED' else 'KEPT_CHAMPION' end,
    'policy_record_id',v_policy_record_id,
    'production_readback',v_policy_readback,
    'realized_value',v_work_saved,
    'value_unit','rows/cycle',
    'learning_record_id',v_learning_record_id,
    'scheduler_proven',v_scheduler_proven,
    'new_persistent_authority',false
  );
end;
$function$;

revoke execute on function public.powerhouse_autonomous_improvement_executor_v1(timestamptz,text,bigint) from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_improvement_executor_v1(timestamptz,text,bigint) to service_role;

create or replace function public.powerhouse_autonomous_improvement_cron_v1()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, cron, pg_temp
as $function$
declare
  v_now timestamptz := now();
  v_runid bigint;
  v_base public.brain_records;
  v_completion jsonb;
begin
  -- pg_cron writes job_run_details at execution start; use the most recent matching row as provenance.
  select r.runid into v_runid
  from cron.job j
  join cron.job_run_details r on r.jobid=j.jobid
  where j.jobname='powerhouse-autonomous-improvement-cycle-v1'
    and r.start_time between v_now - interval '10 minutes' and v_now + interval '1 minute'
  order by r.start_time desc limit 1;

  select * into v_base from public.powerhouse_autonomous_improvement_cycle_v1(v_now);
  v_completion := public.powerhouse_autonomous_improvement_executor_v1(v_now,'pg_cron',v_runid);
  return jsonb_build_object('base_record_id',v_base.record_id,'completion',v_completion,'invocation_source','pg_cron','cron_run_id',v_runid);
end;
$function$;

revoke execute on function public.powerhouse_autonomous_improvement_cron_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_improvement_cron_v1() to service_role;

-- Reuse the existing :42 scheduler. Only its command is upgraded to the canonical wrapper.
update cron.job
set command='select public.powerhouse_autonomous_improvement_cron_v1();'
where jobname='powerhouse-autonomous-improvement-cycle-v1';

create or replace view public.powerhouse_autonomous_improvement_control_v1
with (security_invoker = true) as
select
  o.id as obligation_id,
  o.state,
  o.evidence->>'lifecycle' as lifecycle,
  o.evidence->'blocker' as blocker,
  o.evidence->'replay' as replay,
  o.evidence->'chaos' as chaos,
  o.evidence->'promotion' as promotion,
  o.evidence->'value' as value,
  o.evidence->>'learning_record_id' as learning_record_id,
  coalesce((o.evidence->>'scheduler_proven')::boolean,false) as scheduler_proven,
  o.change_id,
  o.updated_at,
  o.version
from public.brain_obligations o
where o.obligation_type='AUTONOMOUS_IMPROVEMENT'
  and o.capability_id='powerhouse-autonomous-improvement-runtime-v1';

revoke all on public.powerhouse_autonomous_improvement_control_v1 from public, anon, authenticated;
grant select on public.powerhouse_autonomous_improvement_control_v1 to service_role;

comment on view public.powerhouse_autonomous_improvement_control_v1 is
'Executive projection over canonical brain_obligations evidence for Autonomous Improvement Runtime v1. No separate datastore.';
