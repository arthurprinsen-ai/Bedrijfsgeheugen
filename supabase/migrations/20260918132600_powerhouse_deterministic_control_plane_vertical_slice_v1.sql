-- powerhouse deterministic control-plane vertical slice v1
-- Reuses canonical Brain truth stores; introduces no parallel queue, ledger or brain.

alter table public.brain_delivery_evidence
  add column if not exists obligation_id uuid references public.brain_obligations(id),
  add column if not exists operation_id uuid references public.brain_operations(id),
  add column if not exists lineage_key text,
  add column if not exists actor text,
  add column if not exists policy_version text,
  add column if not exists skill_version text,
  add column if not exists tool_run_id text,
  add column if not exists evidence_kind text,
  add column if not exists main_sha text,
  add column if not exists production_sha text;

alter table public.brain_delivery_evidence
  drop constraint if exists brain_delivery_evidence_target_check;

alter table public.brain_delivery_evidence
  add constraint brain_delivery_evidence_target_check
  check (target = any (array[
    'notion'::text,
    'make'::text, -- historical compatibility only; canonical writers below reject new Make evidence
    'supabase'::text,
    'dataforseo'::text,
    'github'::text,
    'netlify'::text,
    'runtime'::text,
    'learning'::text,
    'skill'::text,
    'control_plane'::text
  ]));

create index if not exists brain_delivery_evidence_obligation_created_idx
  on public.brain_delivery_evidence(obligation_id, created_at desc)
  where obligation_id is not null;

create index if not exists brain_delivery_evidence_operation_created_idx
  on public.brain_delivery_evidence(operation_id, created_at desc)
  where operation_id is not null;

create or replace function public.powerhouse_learning_compiler_route_v1(
  p_incident_class text,
  p_scope text default null,
  p_machine_enforceable boolean default true
)
returns text
language plpgsql
immutable
set search_path to 'public','pg_catalog'
as $function$
declare
  v_class text := upper(coalesce(nullif(btrim(p_incident_class),''),'UNKNOWN'));
  v_scope text := upper(coalesce(nullif(btrim(p_scope),''),'GENERAL'));
begin
  if p_machine_enforceable is not true then
    return 'SKILL';
  end if;

  if v_class in ('DATABASE_INTEGRITY','DATA_INTEGRITY') or v_scope='DATABASE' then
    return 'DATABASE_CONSTRAINT';
  elsif v_class in ('GITHUB_DELIVERY','CI','DELIVERY') or v_scope in ('GITHUB','CI') then
    return 'CI_GATE';
  elsif v_class in ('SECURITY','SECURITY_STATIC') then
    return 'CI_SECURITY_GATE';
  elsif v_class in ('RUNTIME_INVARIANT','PRODUCTION_READBACK') or v_scope='RUNTIME' then
    return 'RUNTIME_ASSERTION';
  elsif v_class in ('RECOVERY','TIMEOUT','WORKER_LOST','MAIN_DRIFT') then
    return 'WORKFLOW';
  end if;

  return 'TEST';
end
$function$;

create or replace function public.powerhouse_control_plane_admit_v1(
  p_obligation_key text,
  p_actor text,
  p_payload_sha256 text,
  p_policy_version text,
  p_skill_version text,
  p_tool_run_id text default null,
  p_intent jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_obligation public.brain_obligations;
  v_operation public.brain_operations;
  v_idempotency text;
begin
  if nullif(btrim(p_obligation_key),'') is null
     or nullif(btrim(p_actor),'') is null
     or nullif(btrim(p_payload_sha256),'') is null
     or nullif(btrim(p_policy_version),'') is null
     or nullif(btrim(p_skill_version),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_obligation := public.brain_create_obligation(
    'CONTROL_PLANE',
    'powerhouse-control-plane',
    p_obligation_key,
    'continuous',
    'Europe/Amsterdam',
    p_payload_sha256,
    p_obligation_key,
    p_actor
  );

  v_operation := public.brain_create_operation(
    'agent:powerhouse-control-plane',
    'CONTROL_PLANE_OBLIGATION',
    p_obligation_key,
    p_payload_sha256,
    p_obligation_key,
    'control-plane:' || p_obligation_key
  );

  if v_obligation.state in ('OPEN','READY','BLOCKED') then
    v_obligation := public.brain_transition_obligation(
      v_obligation.id,
      v_obligation.version,
      'RUNNING',
      p_actor,
      coalesce(v_obligation.evidence,'{}'::jsonb)
        || jsonb_build_object(
          'control_plane_contract','powerhouse-deterministic-control-plane-v1',
          'operation_id',v_operation.id,
          'policy_version',p_policy_version,
          'skill_version',p_skill_version,
          'intent',coalesce(p_intent,'{}'::jsonb)
        )
    );
  end if;

  v_idempotency := 'control-plane:user-intent:' || p_obligation_key;

  insert into public.brain_delivery_evidence(
    idempotency_key, change_id, component_id, target, status,
    candidate_identity, tested_identity, payload_sha256, evidence,
    obligation_id, operation_id, lineage_key, actor, policy_version,
    skill_version, tool_run_id, evidence_kind
  ) values (
    v_idempotency,
    p_obligation_key,
    'powerhouse-control-plane',
    'control_plane',
    'GREEN',
    v_operation.id::text,
    v_obligation.id::text,
    p_payload_sha256,
    jsonb_build_object(
      'contract','powerhouse-deterministic-control-plane-v1',
      'stage','USER_INTENT',
      'intent',coalesce(p_intent,'{}'::jsonb),
      'machine_verified',true
    ),
    v_obligation.id,
    v_operation.id,
    p_obligation_key,
    p_actor,
    p_policy_version,
    p_skill_version,
    p_tool_run_id,
    'USER_INTENT'
  )
  on conflict (idempotency_key) do nothing;

  return jsonb_build_object(
    'contract','powerhouse-deterministic-control-plane-v1',
    'obligation_id',v_obligation.id,
    'operation_id',v_operation.id,
    'obligation_key',p_obligation_key,
    'state',v_obligation.state,
    'policy_version',p_policy_version,
    'skill_version',p_skill_version
  );
end
$function$;

create or replace function public.powerhouse_control_plane_record_stage_v1(
  p_obligation_id uuid,
  p_operation_id uuid,
  p_stage text,
  p_status text,
  p_target text,
  p_idempotency_key text,
  p_actor text,
  p_tool_run_id text default null,
  p_policy_version text default null,
  p_skill_version text default null,
  p_main_sha text default null,
  p_production_sha text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns public.brain_delivery_evidence
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_row public.brain_delivery_evidence;
  v_stage text := upper(coalesce(nullif(btrim(p_stage),''),''));
  v_target text := lower(coalesce(nullif(btrim(p_target),''),''));
  v_status text := upper(coalesce(nullif(btrim(p_status),''),''));
begin
  if p_obligation_id is null or p_operation_id is null
     or nullif(btrim(p_idempotency_key),'') is null
     or nullif(btrim(p_actor),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  if v_stage not in (
    'EXECUTION','EXACT_HEAD','MERGE','DEPLOY','PROD_READBACK',
    'OUTCOME','LEARNING','SKILL_PROJECTION','RECOVERY','CLOSED'
  ) then
    raise exception 'INVALID_CONTROL_PLANE_STAGE';
  end if;

  if v_status not in ('GREEN','RED') then
    raise exception 'INVALID_EVIDENCE_STATUS';
  end if;

  if v_target not in (
    'control_plane','github','netlify','supabase','dataforseo',
    'notion','runtime','learning','skill'
  ) then
    raise exception 'INVALID_ACTIVE_TARGET';
  end if;

  if not exists(
    select 1 from public.brain_control_plane_bindings b
    where b.operation_id=p_operation_id
  ) then
    raise exception 'CONTROL_PLANE_BINDING_REQUIRED';
  end if;

  if not exists(
    select 1 from public.brain_delivery_evidence e
    where e.obligation_id=p_obligation_id
      and e.operation_id=p_operation_id
      and e.evidence_kind='USER_INTENT'
      and e.status='GREEN'
  ) then
    raise exception 'CONTROL_PLANE_ADMISSION_REQUIRED';
  end if;

  insert into public.brain_delivery_evidence(
    idempotency_key, change_id, component_id, target, status,
    remote_ref, candidate_identity, tested_identity, evidence,
    obligation_id, operation_id, lineage_key, actor, policy_version,
    skill_version, tool_run_id, evidence_kind, main_sha, production_sha
  )
  select
    p_idempotency_key,
    bo.change_id,
    'powerhouse-control-plane',
    v_target,
    v_status,
    p_tool_run_id,
    p_operation_id::text,
    p_obligation_id::text,
    coalesce(p_evidence,'{}'::jsonb)
      || jsonb_build_object(
        'contract','powerhouse-deterministic-control-plane-v1',
        'stage',v_stage,
        'machine_verified',true
      ),
    p_obligation_id,
    p_operation_id,
    bo.business_entity,
    p_actor,
    p_policy_version,
    p_skill_version,
    p_tool_run_id,
    v_stage,
    p_main_sha,
    p_production_sha
  from public.brain_obligations bo
  where bo.id=p_obligation_id
  on conflict (idempotency_key) do nothing
  returning * into v_row;

  if found then
    return v_row;
  end if;

  select * into v_row
  from public.brain_delivery_evidence
  where idempotency_key=p_idempotency_key;

  if not found
     or v_row.obligation_id is distinct from p_obligation_id
     or v_row.operation_id is distinct from p_operation_id
     or v_row.evidence_kind is distinct from v_stage
     or v_row.status is distinct from v_status then
    raise exception 'EVIDENCE_IDEMPOTENCY_CONFLICT';
  end if;

  return v_row;
end
$function$;

create or replace function public.powerhouse_control_plane_close_v1(
  p_obligation_id uuid,
  p_operation_id uuid,
  p_actor text,
  p_idempotency_key text,
  p_evidence jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_obligation public.brain_obligations;
  v_operation public.brain_operations;
  v_missing text[];
  v_skill_required boolean := false;
begin
  if p_obligation_id is null or p_operation_id is null
     or nullif(btrim(p_actor),'') is null
     or nullif(btrim(p_idempotency_key),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_obligation from public.brain_obligations where id=p_obligation_id for update;
  if not found then raise exception 'OBLIGATION_NOT_FOUND'; end if;

  select * into v_operation from public.brain_operations where id=p_operation_id for update;
  if not found then raise exception 'OPERATION_NOT_FOUND'; end if;

  if not exists(
    select 1 from public.brain_control_plane_bindings b
    where b.operation_id=p_operation_id
  ) then
    raise exception 'CONTROL_PLANE_BINDING_REQUIRED';
  end if;

  select coalesce(array_agg(required_stage),array[]::text[])
    into v_missing
  from (
    select required_stage
    from unnest(array['USER_INTENT','EXECUTION','PROD_READBACK','OUTCOME','LEARNING']) required_stage
    where not exists(
      select 1 from public.brain_delivery_evidence e
      where e.obligation_id=p_obligation_id
        and e.operation_id=p_operation_id
        and e.evidence_kind=required_stage
        and e.status='GREEN'
    )
  ) s;

  if coalesce(array_length(v_missing,1),0)>0 then
    raise exception 'CONTROL_PLANE_EVIDENCE_MISSING:%', array_to_string(v_missing,',');
  end if;

  select coalesce(bool_or(
    coalesce((e.evidence->>'skill_projection_required')::boolean,false)
  ),false)
  into v_skill_required
  from public.brain_delivery_evidence e
  where e.obligation_id=p_obligation_id
    and e.operation_id=p_operation_id
    and e.evidence_kind='LEARNING'
    and e.status='GREEN';

  if v_skill_required and not exists(
    select 1 from public.brain_delivery_evidence e
    where e.obligation_id=p_obligation_id
      and e.operation_id=p_operation_id
      and e.evidence_kind='SKILL_PROJECTION'
      and e.status='GREEN'
  ) then
    raise exception 'SKILL_PROJECTION_EVIDENCE_REQUIRED';
  end if;

  if not exists(
    select 1 from public.brain_delivery_evidence e
    where e.obligation_id=p_obligation_id
      and e.operation_id=p_operation_id
      and e.evidence_kind='LEARNING'
      and e.status='GREEN'
      and coalesce(e.evidence->>'prevention_kind','') in (
        'DATABASE_CONSTRAINT','CI_GATE','CI_SECURITY_GATE',
        'RUNTIME_ASSERTION','WORKFLOW','TEST','SKILL'
      )
  ) then
    raise exception 'LEARNING_PREVENTION_NOT_COMPILED';
  end if;

  if v_operation.status <> 'VERIFIED' then
    v_operation := public.brain_transition_operation(
      v_operation.id,
      v_operation.version,
      'VERIFIED',
      null,
      null,
      coalesce(v_operation.evidence,'{}'::jsonb)
        || jsonb_build_object(
          'control_plane_closed',true,
          'control_plane_closed_at',clock_timestamp(),
          'obligation_id',p_obligation_id
        )
    );
  end if;

  if v_obligation.state <> 'FULFILLED' then
    v_obligation := public.brain_transition_obligation(
      v_obligation.id,
      v_obligation.version,
      'FULFILLED',
      p_actor,
      coalesce(v_obligation.evidence,'{}'::jsonb)
        || jsonb_build_object(
          'control_plane_closed',true,
          'operation_id',p_operation_id,
          'closed_at',clock_timestamp()
        )
    );
  end if;

  perform public.powerhouse_control_plane_record_stage_v1(
    p_obligation_id,
    p_operation_id,
    'CLOSED',
    'GREEN',
    'control_plane',
    p_idempotency_key,
    p_actor,
    null,
    null,
    null,
    null,
    null,
    coalesce(p_evidence,'{}'::jsonb)
      || jsonb_build_object('terminal_state','FULFILLED')
  );

  return jsonb_build_object(
    'contract','powerhouse-deterministic-control-plane-v1',
    'obligation_id',p_obligation_id,
    'operation_id',p_operation_id,
    'state','FULFILLED',
    'machine_closed',true
  );
end
$function$;

create or replace view public.powerhouse_control_plane_status_v1
with (security_invoker = on)
as
select
  bo.id as obligation_id,
  bo.business_entity as obligation_key,
  bo.state,
  bo.owner,
  bo.version,
  min(bde.created_at) filter (where bde.evidence_kind='USER_INTENT') as admitted_at,
  max(bde.created_at) as last_evidence_at,
  count(bde.id) as evidence_count,
  array_remove(array_agg(distinct bde.evidence_kind),null) as evidence_stages,
  case
    when bo.state='FULFILLED' then 'NONE'
    when not coalesce(bool_or(bde.evidence_kind='EXECUTION' and bde.status='GREEN'),false) then 'EXECUTE'
    when not coalesce(bool_or(bde.evidence_kind='PROD_READBACK' and bde.status='GREEN'),false) then 'VERIFY_PRODUCTION'
    when not coalesce(bool_or(bde.evidence_kind='OUTCOME' and bde.status='GREEN'),false) then 'CAPTURE_OUTCOME'
    when not coalesce(bool_or(bde.evidence_kind='LEARNING' and bde.status='GREEN'),false) then 'COMPILE_LEARNING'
    else 'CLOSE'
  end as next_action
from public.brain_obligations bo
left join public.brain_delivery_evidence bde on bde.obligation_id=bo.id
where bo.obligation_type='CONTROL_PLANE'
group by bo.id,bo.business_entity,bo.state,bo.owner,bo.version;

create or replace function public.powerhouse_control_plane_selftest_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_admit jsonb;
  v_obligation uuid;
  v_operation uuid;
  v_prevention text;
  v_result jsonb;
begin
  v_admit := public.powerhouse_control_plane_admit_v1(
    'powerhouse-control-plane-selftest-v1',
    'powerhouse-selftest',
    repeat('a',64),
    'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1',
    'POWERHOUSE-ONE-LOOP-v1',
    'supabase:selftest',
    jsonb_build_object('goal','prove USER_INTENT to CLOSED on production Supabase')
  );

  v_obligation := (v_admit->>'obligation_id')::uuid;
  v_operation := (v_admit->>'operation_id')::uuid;

  perform public.powerhouse_control_plane_record_stage_v1(
    v_obligation,v_operation,'EXECUTION','GREEN','supabase',
    'control-plane:selftest:execution','powerhouse-selftest','supabase:selftest',
    'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1','POWERHOUSE-ONE-LOOP-v1',
    null,null,jsonb_build_object('execution','production-rpc')
  );

  perform public.powerhouse_control_plane_record_stage_v1(
    v_obligation,v_operation,'PROD_READBACK','GREEN','supabase',
    'control-plane:selftest:prod-readback','powerhouse-selftest','supabase:selftest',
    'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1','POWERHOUSE-ONE-LOOP-v1',
    null,null,jsonb_build_object('readback','same production database returned canonical state')
  );

  perform public.powerhouse_control_plane_record_stage_v1(
    v_obligation,v_operation,'OUTCOME','GREEN','runtime',
    'control-plane:selftest:outcome','powerhouse-selftest','supabase:selftest',
    'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1','POWERHOUSE-ONE-LOOP-v1',
    null,null,jsonb_build_object('outcome','vertical slice mechanically enforced')
  );

  v_prevention := public.powerhouse_learning_compiler_route_v1('DATABASE_INTEGRITY','DATABASE',true);

  perform public.powerhouse_control_plane_record_stage_v1(
    v_obligation,v_operation,'LEARNING','GREEN','learning',
    'control-plane:selftest:learning','powerhouse-selftest','supabase:selftest',
    'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1','POWERHOUSE-ONE-LOOP-v1',
    null,null,jsonb_build_object(
      'prevention_kind',v_prevention,
      'skill_projection_required',false,
      'learning','terminal claims require canonical evidence'
    )
  );

  v_result := public.powerhouse_control_plane_close_v1(
    v_obligation,
    v_operation,
    'powerhouse-selftest',
    'control-plane:selftest:closed',
    jsonb_build_object('proof','idempotent production selftest')
  );

  return v_result || jsonb_build_object(
    'evidence_count',(
      select count(*) from public.brain_delivery_evidence e
      where e.obligation_id=v_obligation and e.operation_id=v_operation
    ),
    'binding_count',(
      select count(*) from public.brain_control_plane_bindings b
      where b.operation_id=v_operation
    )
  );
end
$function$;

comment on view public.powerhouse_control_plane_status_v1 is
  'Projection over canonical Brain obligations + delivery evidence. No parallel truth store.';

revoke all on function public.powerhouse_control_plane_admit_v1(text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.powerhouse_control_plane_record_stage_v1(uuid,uuid,text,text,text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.powerhouse_control_plane_close_v1(uuid,uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.powerhouse_control_plane_selftest_v1() from public, anon, authenticated;
revoke all on function public.powerhouse_learning_compiler_route_v1(text,text,boolean) from public, anon, authenticated;

grant execute on function public.powerhouse_control_plane_admit_v1(text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.powerhouse_control_plane_record_stage_v1(uuid,uuid,text,text,text,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.powerhouse_control_plane_close_v1(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.powerhouse_control_plane_selftest_v1() to service_role;
grant execute on function public.powerhouse_learning_compiler_route_v1(text,text,boolean) to service_role;

revoke all on public.powerhouse_control_plane_status_v1 from public, anon, authenticated;
grant select on public.powerhouse_control_plane_status_v1 to service_role;
