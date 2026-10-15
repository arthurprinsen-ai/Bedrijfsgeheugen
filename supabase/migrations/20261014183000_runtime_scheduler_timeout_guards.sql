-- Restore hard timeouts for the runtime mux; no provider dispatches are introduced.
-- Idempotent for existing production and preview environments.
create or replace function public.powerhouse_runtime_mux_task_v1(
  p_task text, p_sql text, p_timeout_ms integer default 10000
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_started timestamptz:=clock_timestamp();
  v_prior_timeout text:=current_setting('statement_timeout');
begin
  if p_timeout_ms < 1000 or p_timeout_ms > 30000 then
    raise exception 'VALIDATION_ERROR';
  end if;

  perform set_config('statement_timeout',p_timeout_ms::text,true);
  execute p_sql;
  perform set_config('statement_timeout',v_prior_timeout,true);

  return jsonb_build_object(
    'task',p_task,'ok',true,
    'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
  );
exception
  when query_canceled then
    perform set_config('statement_timeout',v_prior_timeout,true);
    return jsonb_build_object(
      'task',p_task,'ok',false,'state','TIMEOUT',
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  when others then
    perform set_config('statement_timeout',v_prior_timeout,true);
    return jsonb_build_object(
      'task',p_task,'ok',false,'state','ERROR','sqlstate',sqlstate,
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
end
$function$;

-- The dynamically executed privileged SQL must not be directly callable by web roles.
revoke all on function public.powerhouse_runtime_mux_task_v1(text,text,integer)
  from public, anon, authenticated;
grant execute on function public.powerhouse_runtime_mux_task_v1(text,text,integer)
  to service_role;

-- Apply an outer statement budget before the DO starts. Preserve the active job and frequency.
do $guard$
declare
  v_command text;
  v_expected text :=
    'do $mux$ begin if not pg_try_advisory_xact_lock(hashtextextended(''powerhouse-runtime-scheduler-outer'',0)) then return; end if; perform set_config(''statement_timeout'',''25000'',true); perform public.powerhouse_runtime_scheduler_mux_v3(now()); end; $mux$;';
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron unavailable: skipping scheduler command update';
    return;
  end if;
  select command into v_command from cron.job where jobid=171 and active=true;
  if v_command is null then
    raise notice 'Active scheduler job 171 absent: leaving cron unchanged';
    return;
  end if;
  if v_command like E'SET statement_timeout = ''30s'';\n%' then
    return;
  end if;
  if v_command is distinct from v_expected then
    raise exception 'Scheduler 171 command differs from reviewed source; fail closed';
  end if;
  perform cron.alter_job(
    171,
    command => E'SET statement_timeout = ''30s'';\n'||
      replace(v_command, 'perform set_config(''statement_timeout'',''25000'',true); ', '')
  );
end
$guard$;
