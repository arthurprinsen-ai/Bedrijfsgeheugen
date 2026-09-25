-- P0 production-truth replay baseline compatibility.
-- Historical production had this desired-state row before migrations captured it.
-- Fresh preview/replay environments do not, so create only the proven baseline.
-- Existing retired production state is preserved verbatim; unexpected drift fails closed.
do $do$
declare
  v_row public.brain_desired_states;
  v_baseline jsonb := '{"mode":"ACTIVE","healthy":true}'::jsonb;
  v_retired jsonb := jsonb_build_object(
    'mode','ACTIVE',
    'healthy',true,
    'lifecycle','RETIRED',
    'retired_reason','HISTORICAL_TIMEBOXED_PROOF_EXPIRED',
    'retired_at','2026-09-20T08:10:00Z'
  );
begin
  select * into v_row
  from public.brain_desired_states
  where subject_type='P0_PROOF'
    and subject_id='production-truth-proof-20260831-v1'
    and environment='production'
  for update;

  if not found then
    perform public.brain_register_desired_state(
      'P0_PROOF',
      'production-truth-proof-20260831-v1',
      'production',
      v_baseline,
      'artifact-v1',
      0
    );
    return;
  end if;

  if v_row.version=1
     and v_row.desired_state=v_baseline
     and v_row.artifact_version='artifact-v1' then
    return;
  end if;

  if v_row.version=2
     and v_row.desired_state=v_retired
     and v_row.artifact_version='production-truth-proof-20260831-v1-retired' then
    return;
  end if;

  raise exception 'P0_PROOF_REPLAY_BASELINE_DRIFT'
    using detail = format(
      'version=%s desired_state=%s artifact_version=%s',
      v_row.version,
      v_row.desired_state::text,
      coalesce(v_row.artifact_version,'NULL')
    );
end
$do$;
