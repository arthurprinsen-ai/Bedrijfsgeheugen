do $$
declare
  v_def text;
  v_old constant text := 'declare v_tijd timestamptz := now(); r record;';
  v_new constant text := 'declare v_tijd timestamptz := clock_timestamp(); r record;';
begin
  select pg_get_functiondef('public.bg_gezondheid_meten()'::regprocedure) into v_def;
  if position(v_new in v_def) > 0 then
    return;
  end if;
  if position(v_old in v_def) = 0 then
    raise exception 'BG_GEZONDHEID_RUN_IDENTITY_SIGNATURE_NOT_FOUND';
  end if;
  execute replace(v_def,v_old,v_new);
end $$;
