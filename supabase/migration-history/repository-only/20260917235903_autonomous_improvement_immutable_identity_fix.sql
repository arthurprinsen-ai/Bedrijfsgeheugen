-- Root cause: the executor attempted to mutate brain_obligations.payload_sha256
-- even though brain_guard_obligation_identity intentionally makes it immutable.
-- Patch the executor, never weaken the integrity trigger.

do $patch$
declare
  v_oid oid;
  v_sql text;
  v_old text := E'    payload_sha256=excluded.payload_sha256,\n';
begin
  select p.oid into v_oid
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='powerhouse_autonomous_improvement_executor_v1'
    and pg_get_function_identity_arguments(p.oid)='p_now timestamp with time zone, p_invocation_source text, p_cron_run_id bigint';

  if v_oid is null then
    raise exception 'AUTONOMOUS_IMPROVEMENT_EXECUTOR_NOT_FOUND';
  end if;

  select pg_get_functiondef(v_oid) into v_sql;
  if position(v_old in v_sql)=0 then
    raise exception 'EXPECTED_IMMUTABLE_PAYLOAD_UPDATE_NOT_FOUND';
  end if;

  v_sql := replace(v_sql, v_old, '');
  execute v_sql;
end
$patch$;

-- Regression proof: immutable trigger remains unchanged and the executor no longer assigns
-- payload_sha256 from EXCLUDED during conflict recovery.
do $verify$
declare v_executor text; v_guard text;
begin
  select pg_get_functiondef(p.oid) into v_executor
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='powerhouse_autonomous_improvement_executor_v1'
  limit 1;

  select pg_get_functiondef(p.oid) into v_guard
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='brain_guard_obligation_identity'
  limit 1;

  if position('payload_sha256=excluded.payload_sha256' in v_executor)>0 then
    raise exception 'IMMUTABLE_PAYLOAD_UPDATE_STILL_PRESENT';
  end if;
  if position('new.payload_sha256 is distinct from old.payload_sha256' in v_guard)=0 then
    raise exception 'IMMUTABLE_IDENTITY_GUARD_WEAKENED';
  end if;
end
$verify$;
