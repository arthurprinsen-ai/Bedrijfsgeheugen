create or replace function public.powerhouse_learning_compiler_v1(
  p_failure_class text,
  p_scope text default 'GENERAL',
  p_machine_enforceable boolean default true,
  p_repeat_count integer default 1,
  p_security_sensitive boolean default false
)
returns jsonb
language plpgsql
immutable
set search_path to 'public','pg_catalog'
as $function$
declare
  v_class text := upper(coalesce(nullif(btrim(p_failure_class),''),'UNKNOWN'));
  v_scope text := upper(coalesce(nullif(btrim(p_scope),''),'GENERAL'));
  v_enforcement text;
  v_eval text;
  v_shadow boolean := false;
  v_canary boolean := false;
begin
  if p_repeat_count < 1 then raise exception 'VALIDATION_ERROR'; end if;

  if not p_machine_enforceable then
    v_enforcement := 'SKILL'; v_eval := 'HISTORICAL_REPLAY';
  elsif p_security_sensitive or v_class in ('SECURITY','AUTH','RLS','SECRET_EXPOSURE') then
    v_enforcement := 'CI_SECURITY_GATE'; v_eval := 'SHADOW_THEN_CANARY'; v_shadow := true; v_canary := true;
  elsif v_class in ('TIMEOUT','WORKER_LOST','RECOVERY','CONNECTOR_FAILURE','QUEUE_STALL') then
    v_enforcement := 'WORKFLOW'; v_eval := 'SHADOW'; v_shadow := true;
  elsif v_scope='DATABASE' or v_class in ('DATABASE_INTEGRITY','DATA_INTEGRITY','SCHEMA_DRIFT') then
    v_enforcement := 'DATABASE_CONSTRAINT'; v_eval := 'HISTORICAL_REPLAY';
  elsif v_class in ('PRODUCTION_READBACK','RUNTIME_INVARIANT','FALSE_GREEN','FALSE_SUCCESS') or v_scope='RUNTIME' then
    v_enforcement := 'RUNTIME_ASSERTION'; v_eval := 'CANARY'; v_canary := true;
  elsif v_class in ('MAIN_DRIFT','CI','GITHUB_DELIVERY','DELIVERY','CLASSIFIER_GAP','METADATA_DRIFT') or v_scope in ('GITHUB','CI') then
    v_enforcement := 'CI_GATE'; v_eval := 'HISTORICAL_REPLAY';
  else
    v_enforcement := 'TEST'; v_eval := 'HISTORICAL_REPLAY';
  end if;

  return jsonb_build_object(
    'contract','powerhouse-learning-compiler-v1',
    'failure_class',v_class,'scope',v_scope,
    'machine_enforceable',p_machine_enforceable,'repeat_count',p_repeat_count,
    'security_sensitive',p_security_sensitive,
    'enforcement_kind',v_enforcement,'evaluation_mode',v_eval,
    'shadow_required',v_shadow,'canary_required',v_canary,
    'canonical_eligible',false,
    'canonicalization_requirement','evaluation_evidence_required'
  );
end;
$function$;

revoke execute on function public.powerhouse_learning_compiler_v1(text,text,boolean,integer,boolean)
  from public, anon, authenticated;
grant execute on function public.powerhouse_learning_compiler_v1(text,text,boolean,integer,boolean)
  to service_role;