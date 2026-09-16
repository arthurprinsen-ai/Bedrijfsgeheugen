-- Natural pg_cron production proof exposed a canonical Brain taxonomy mismatch:
-- record_kind=current_state was paired with invalid record_type=improvement.
-- Keep prior applied migrations immutable and correct the live function forward-only.
do $fix$
declare
  v_def text;
  v_old constant text := '''canonical'',v_record_id,''improvement'',''current_state''';
  v_new constant text := '''canonical'',v_record_id,''CurrentState'',''current_state''';
begin
  select pg_get_functiondef('public.powerhouse_autonomous_improvement_cycle_v1(timestamptz)'::regprocedure)
    into v_def;

  if position(v_new in v_def) > 0 then
    return;
  end if;

  if position(v_old in v_def) = 0 then
    raise exception 'Expected autonomous improvement Brain append signature not found; refusing unsafe rewrite';
  end if;

  execute replace(v_def, v_old, v_new);
end;
$fix$;

comment on function public.powerhouse_autonomous_improvement_cycle_v1(timestamptz) is
'Canonical autonomous improvement base cycle. Writes Brain CurrentState/current_state records; corrected after natural pg_cron proof exposed invalid legacy record_type improvement.';
