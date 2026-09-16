-- Clean replay repair: the original advisor hardening sorts before the
-- migrations that create these internal views. Enforce the same fail-closed
-- privileges again after the complete historical migration chain.

do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'powerhouse_revenue_flywheel_v1',
    'powerhouse_outcome_sweep_queue_v1',
    'powerhouse_experiment_decision_queue_v1'
  ] loop
    if to_regclass(format('public.%I',v_name)) is null then
      raise exception 'POWERHOUSE_INTERNAL_VIEW_MISSING_AFTER_REPLAY: %', v_name;
    end if;
  end loop;
end
$$;

alter view public.powerhouse_revenue_flywheel_v1 set (security_invoker = true);
revoke all on table public.powerhouse_revenue_flywheel_v1 from public, anon, authenticated;
grant select on table public.powerhouse_revenue_flywheel_v1 to service_role;

alter view public.powerhouse_outcome_sweep_queue_v1 set (security_invoker = true);
revoke all on table public.powerhouse_outcome_sweep_queue_v1 from public, anon, authenticated;
grant select on table public.powerhouse_outcome_sweep_queue_v1 to service_role;

alter view public.powerhouse_experiment_decision_queue_v1 set (security_invoker = true);
revoke all on table public.powerhouse_experiment_decision_queue_v1 from public, anon, authenticated;
grant select on table public.powerhouse_experiment_decision_queue_v1 to service_role;
