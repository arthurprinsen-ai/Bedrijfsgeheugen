do $$
declare
  v_def text;
begin
  select pg_get_viewdef('public.powerhouse_one_brain_runtime_health_v1'::regclass, true)
    into v_def;

  if position('powerhouse-reconciliation-worker-v2' in v_def)>0 then
    return;
  end if;

  if position('powerhouse-reconciliation-worker-v1' in v_def)=0 then
    raise exception 'neither v1 nor v2 reconciliation worker contract found in runtime health view';
  end if;

  v_def := replace(v_def,
    '''powerhouse-reconciliation-worker-v1''',
    '''powerhouse-reconciliation-worker-v2'''
  );
  execute 'create or replace view public.powerhouse_one_brain_runtime_health_v1 as ' || v_def;
end $$;

alter view public.powerhouse_one_brain_runtime_health_v1 set (security_invoker = true);
revoke all on public.powerhouse_one_brain_runtime_health_v1 from public, anon, authenticated;
grant select on public.powerhouse_one_brain_runtime_health_v1 to service_role;
