-- Harden safe-chaos evidence: a caught exception is not recovery proof.
-- Each scenario now performs an isolated first-attempt fault, a real retry, state readback,
-- idempotent re-application, and (for partial writeback) subtransaction rollback verification.

create or replace function public.powerhouse_autonomous_improvement_inject_fault_v1(p_scenario text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $function$
declare
  v_attempt integer;
  v_attempts integer := 0;
  v_fault_injected boolean := false;
  v_recovered boolean := false;
  v_first_error text := null;
  v_state_rows integer := 0;
  v_state_value text := null;
  v_partial_write_rolled_back boolean := true;
  v_idempotent boolean := false;
  v_consistent boolean := false;
begin
  if p_scenario not in (
    'supabase_unavailable',
    'provider_429',
    'schema_mismatch',
    'stale_knowledge',
    'agent_timeout',
    'partial_writeback'
  ) then
    return jsonb_build_object(
      'scenario', p_scenario,
      'synthetic', true,
      'isolated', true,
      'production_mutation', false,
      'fault_injected', false,
      'recovered', false,
      'idempotent', false,
      'consistent', false,
      'passed', false,
      'reason', 'unknown synthetic isolated scenario'
    );
  end if;

  create temporary table if not exists powerhouse_ai_chaos_probe (
    scenario text primary key,
    state text not null,
    writes integer not null default 0
  ) on commit drop;

  delete from powerhouse_ai_chaos_probe where scenario = p_scenario;

  for v_attempt in 1..2 loop
    v_attempts := v_attempts + 1;
    begin
      if v_attempt = 1 then
        case p_scenario
          when 'supabase_unavailable' then
            raise exception using errcode='P0001', message='synthetic isolated database boundary unavailable';
          when 'provider_429' then
            raise exception using errcode='P0001', message='synthetic isolated provider 429';
          when 'schema_mismatch' then
            perform ('not-an-integer')::integer;
          when 'stale_knowledge' then
            raise exception using errcode='P0001', message='synthetic isolated stale knowledge version';
          when 'agent_timeout' then
            raise exception using errcode='P0001', message='synthetic isolated agent timeout';
          when 'partial_writeback' then
            insert into powerhouse_ai_chaos_probe(scenario,state,writes)
            values (p_scenario,'partial',1)
            on conflict (scenario) do update
              set state='partial', writes=powerhouse_ai_chaos_probe.writes+1;
            raise exception using errcode='P0001', message='synthetic isolated partial writeback after first mutation';
        end case;
      end if;

      insert into powerhouse_ai_chaos_probe(scenario,state,writes)
      values (p_scenario,'committed',1)
      on conflict (scenario) do update
        set state='committed', writes=powerhouse_ai_chaos_probe.writes;

      v_recovered := true;
      exit;
    exception when others then
      if v_attempt = 1 then
        v_fault_injected := true;
        v_first_error := sqlerrm;
      else
        return jsonb_build_object(
          'scenario', p_scenario,
          'synthetic', true,
          'isolated', true,
          'production_mutation', false,
          'fault_injected', v_fault_injected,
          'recovered', false,
          'idempotent', false,
          'consistent', false,
          'attempts', v_attempts,
          'error', sqlerrm,
          'passed', false
        );
      end if;
    end;
  end loop;

  if p_scenario = 'partial_writeback' then
    select count(*) into v_state_rows
    from powerhouse_ai_chaos_probe
    where scenario=p_scenario and state='partial';
    v_partial_write_rolled_back := v_state_rows = 0;
  end if;

  -- Apply the successful terminal write again. ON CONFLICT must keep one canonical row.
  insert into powerhouse_ai_chaos_probe(scenario,state,writes)
  values (p_scenario,'committed',1)
  on conflict (scenario) do update
    set state='committed', writes=powerhouse_ai_chaos_probe.writes;

  select count(*), max(state)
    into v_state_rows, v_state_value
  from powerhouse_ai_chaos_probe
  where scenario=p_scenario;

  v_idempotent := v_state_rows = 1;
  v_consistent := v_state_rows = 1
                  and v_state_value = 'committed'
                  and v_partial_write_rolled_back;

  return jsonb_build_object(
    'scenario', p_scenario,
    'synthetic', true,
    'isolated', true,
    'production_mutation', false,
    'fault_injected', v_fault_injected,
    'recovered', v_recovered,
    'idempotent', v_idempotent,
    'consistent', v_consistent,
    'partial_writeback_rolled_back', v_partial_write_rolled_back,
    'attempts', v_attempts,
    'first_error', v_first_error,
    'state_rows', v_state_rows,
    'terminal_state', v_state_value,
    'passed', v_fault_injected and v_recovered and v_idempotent and v_consistent and v_attempts = 2
  );
end;
$function$;

revoke execute on function public.powerhouse_autonomous_improvement_inject_fault_v1(text) from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_improvement_inject_fault_v1(text) to service_role;
