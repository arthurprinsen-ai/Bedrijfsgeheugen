do $$
declare
  v_def text;
begin
  select pg_get_viewdef('public.powerhouse_one_brain_runtime_health_v1'::regclass, true)
    into v_def;
  if position('powerhouse-reconciliation-worker-v1' in v_def)=0 then
    raise exception 'expected v1 reconciliation worker contract not found in runtime health view';
  end if;
  v_def := replace(v_def,
    '''powerhouse-reconciliation-worker-v1''',
    '''powerhouse-reconciliation-worker-v2'''
  );
  execute 'create or replace view public.powerhouse_one_brain_runtime_health_v1 as ' || v_def;
end $$;
