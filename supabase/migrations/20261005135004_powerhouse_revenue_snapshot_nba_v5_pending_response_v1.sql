do $$
declare
  v_oid oid;
  v_ddl text;
begin
  select oid into v_oid
  from pg_proc
  where pronamespace='public'::regnamespace
    and proname='powerhouse_refresh_revenue_intelligence_snapshot_v1';

  if v_oid is null then
    raise exception 'powerhouse_refresh_revenue_intelligence_snapshot_v1 not found';
  end if;

  v_ddl := pg_get_functiondef(v_oid);
  v_ddl := replace(
    v_ddl,
    'select * from public.powerhouse_commercial_next_best_action_v2',
    'select * from public.powerhouse_commercial_next_best_action_v5'
  );
  v_ddl := replace(
    v_ddl,
    'case
        when ps.cooldown_until>now() then ''cooldown''',
    'case
        when coalesce(b.pending_response,false) then ''wait''
        when ps.cooldown_until>now() then ''cooldown'''
  );
  v_ddl := replace(
    v_ddl,
    '''pressure_state'',r.pressure_state,
      ''research_reason'',r.research_reason,',
    '''pressure_state'',r.pressure_state,
      ''pending_response'',coalesce(r.pending_response,false),
      ''research_reason'',r.research_reason,'
  );

  execute v_ddl;
end $$;
