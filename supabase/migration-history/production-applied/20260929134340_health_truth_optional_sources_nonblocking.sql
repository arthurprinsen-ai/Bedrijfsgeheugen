
do $migration$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
  into v_def
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='bg_gezondheid_meten'
  limit 1;

  if v_def is null then raise exception 'bg_gezondheid_meten not found'; end if;

  v_def := replace(
    v_def,
    'case when t.required_activity and t.laatst is null then ''fout'' when t.laatst is null then ''ok'' when t.laatst<now()-t.max_leeftijd then ''fout'' when t.laatst<now()-t.max_leeftijd/2 then ''waarschuwing'' else ''ok'' end',
    'case when t.required_activity and t.laatst is null then ''fout'' when t.laatst is null then ''ok'' when t.laatst<now()-t.max_leeftijd and t.required_activity then ''fout'' when t.laatst<now()-t.max_leeftijd then ''waarschuwing'' when t.laatst<now()-t.max_leeftijd/2 then ''waarschuwing'' else ''ok'' end'
  );

  v_def := replace(
    v_def,
    'case when g.status=''ok'' then ''observed'' else ''error'' end,case when g.status=''ok'' then ''OBSERVED'' else ''DEGRADED'' end,case when g.status=''ok'' then 1.0 else 0.5 end',
    'case when g.status=''fout'' and coalesce((g.gegevens->>''required_activity'')::boolean,false) then ''error'' else ''observed'' end,case when g.status=''ok'' then ''OBSERVED'' else ''DEGRADED'' end,case when g.status=''ok'' then 1.0 when g.status=''waarschuwing'' then 0.75 else 0.5 end'
  );

  execute v_def;
end
$migration$;
