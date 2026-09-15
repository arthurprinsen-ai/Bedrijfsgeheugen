-- Powerhouse Market-Truth Ingress v1
-- Lifecycle closure for prospectively persisted commercial experiments.
-- This function matures only evidence-eligible assignments and never creates outcomes.

create or replace function public.powerhouse_mature_experiment_assignments_v1(
  p_now timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_matured integer := 0;
  v_missed_treatment integer := 0;
begin
  update public.powerhouse_experiment_assignments
  set state = 'matured', updated_at = now()
  where measurement_horizon_end <= v_now
    and state in ('assigned','treated')
    and (
      assignment_arm = 'holdout'
      or (assignment_arm = 'treatment' and treatment_action_id is not null)
    );
  get diagnostics v_matured = row_count;

  select count(*) into v_missed_treatment
  from public.powerhouse_experiment_assignments
  where measurement_horizon_end <= v_now
    and assignment_arm = 'treatment'
    and treatment_action_id is null
    and state = 'assigned';

  return jsonb_build_object(
    'matured_count', v_matured,
    'unexecuted_treatment_past_horizon', v_missed_treatment,
    'measured_at', v_now,
    'truth_boundary', 'maturity changes lifecycle state only; it never synthesizes an outcome'
  );
end;
$$;

revoke execute on function public.powerhouse_mature_experiment_assignments_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_mature_experiment_assignments_v1(timestamptz) to service_role;
comment on function public.powerhouse_mature_experiment_assignments_v1(timestamptz) is 'Matures expired holdouts and executed treatments only. Unexecuted treatment assignments remain visible evidence debt; no outcome is synthesized.';

-- Keep horizon closure independent of browser/runtime availability.
do $$
declare v_jobid bigint;
begin
  for v_jobid in select jobid from cron.job where jobname = 'powerhouse-market-truth-maturity-hourly-v1' loop
    perform cron.unschedule(v_jobid);
  end loop;
end $$;

select cron.schedule(
  'powerhouse-market-truth-maturity-hourly-v1',
  '17 * * * *',
  $$select public.powerhouse_mature_experiment_assignments_v1(now());$$
);
