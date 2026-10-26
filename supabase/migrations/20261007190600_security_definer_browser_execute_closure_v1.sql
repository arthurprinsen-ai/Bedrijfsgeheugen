do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prosecdef
      and (
        has_function_privilege('anon',p.oid,'EXECUTE')
        or has_function_privilege('authenticated',p.oid,'EXECUTE')
      )
  loop
    execute format('revoke execute on function %I.%I(%s) from public, anon, authenticated', r.nspname, r.proname, r.args);
    execute format('grant execute on function %I.%I(%s) to service_role', r.nspname, r.proname, r.args);
  end loop;
end $$;
