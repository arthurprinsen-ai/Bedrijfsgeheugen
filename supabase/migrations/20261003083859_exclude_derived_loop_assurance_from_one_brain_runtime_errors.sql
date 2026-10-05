do $$
declare
  v_def text;
  v_old text := 'AND NOT (ranked.event_type = ''full_cycle_production_proof''::text AND ranked.subject_key <> (now() AT TIME ZONE ''Europe/Amsterdam''::text)::date::text)';
  v_new text := v_old || ' AND NOT (ranked.event_type = ''loop_assurance_refresh''::text AND ranked.source = ''powerhouse-loop-assurance-v2''::text)';
begin
  select pg_get_viewdef('public.powerhouse_one_brain_runtime_health_v1'::regclass,true) into v_def;
  if position(v_old in v_def)=0 then
    raise exception 'expected current_runtime guard fragment not found';
  end if;
  v_def := replace(v_def,v_old,v_new);
  execute 'create or replace view public.powerhouse_one_brain_runtime_health_v1 as ' || v_def;
end $$;
