-- Powerhouse policy canonicalization guard v1
-- Extends the existing policy authority. No parallel policy store.

create or replace function public.powerhouse_policy_promotion_guard_v1()
returns trigger
language plpgsql
set search_path to 'public','pg_catalog'
as $function$
declare
  v_compiled jsonb;
  v_eval jsonb;
  v_mode text;
  v_status text;
begin
  if new.decision_state <> 'promoted'
     or (tg_op='UPDATE' and old.decision_state='promoted') then
    return new;
  end if;

  v_compiled := public.powerhouse_learning_compiler_v1(
    coalesce(nullif(new.evidence->>'failure_class',''),'UNKNOWN'),
    coalesce(nullif(new.evidence->>'scope',''),'GENERAL'),
    coalesce((new.evidence->>'machine_enforceable')::boolean,true),
    coalesce((new.evidence->>'repeat_count')::integer,1),
    coalesce((new.evidence->>'security_sensitive')::boolean,false)
  );

  v_eval := coalesce(new.evidence->'evaluation','{}'::jsonb);
  v_mode := v_compiled->>'evaluation_mode';
  v_status := upper(coalesce(v_eval->>'status',''));

  if v_status <> 'GREEN' then
    raise exception 'POLICY_PROMOTION_EVALUATION_NOT_GREEN';
  end if;

  if coalesce(v_eval->>'compiler_contract','') <> 'powerhouse-learning-compiler-v1' then
    raise exception 'POLICY_PROMOTION_COMPILER_CONTRACT_MISSING';
  end if;

  if coalesce(v_eval->>'candidate_policy_version','') <> new.policy_version then
    raise exception 'POLICY_PROMOTION_CANDIDATE_IDENTITY_MISMATCH';
  end if;

  if nullif(v_eval->>'evaluated_at','') is null then
    raise exception 'POLICY_PROMOTION_EVALUATED_AT_MISSING';
  end if;

  if new.effect_snapshot='{}'::jsonb then
    raise exception 'POLICY_PROMOTION_EFFECT_SNAPSHOT_REQUIRED';
  end if;

  if v_mode='HISTORICAL_REPLAY'
     and coalesce((v_eval->>'historical_replay_passed')::boolean,false) is not true then
    raise exception 'POLICY_PROMOTION_HISTORICAL_REPLAY_REQUIRED';
  end if;

  if v_mode='SHADOW'
     and coalesce((v_eval->>'shadow_passed')::boolean,false) is not true then
    raise exception 'POLICY_PROMOTION_SHADOW_REQUIRED';
  end if;

  if v_mode='CANARY'
     and coalesce((v_eval->>'canary_passed')::boolean,false) is not true then
    raise exception 'POLICY_PROMOTION_CANARY_REQUIRED';
  end if;

  if v_mode='SHADOW_THEN_CANARY'
     and (
       coalesce((v_eval->>'shadow_passed')::boolean,false) is not true
       or coalesce((v_eval->>'canary_passed')::boolean,false) is not true
     ) then
    raise exception 'POLICY_PROMOTION_SHADOW_AND_CANARY_REQUIRED';
  end if;

  if coalesce((v_compiled->>'canonical_eligible')::boolean,false) is true then
    raise exception 'LEARNING_COMPILER_CANONICAL_ELIGIBILITY_CONTRACT_DRIFT';
  end if;

  if coalesce(v_compiled->>'canonicalization_requirement','') <> 'evaluation_evidence_required' then
    raise exception 'LEARNING_COMPILER_CANONICALIZATION_CONTRACT_DRIFT';
  end if;

  new.evidence := new.evidence || jsonb_build_object(
    'canonicalization',
    jsonb_build_object(
      'contract','powerhouse-policy-canonicalization-guard-v1',
      'compiler',v_compiled,
      'evaluation_mode',v_mode,
      'evaluation_status','GREEN',
      'canonicalized_at',clock_timestamp()
    )
  );
  new.promoted_at := coalesce(new.promoted_at,clock_timestamp());
  return new;
end;
$function$;

drop trigger if exists powerhouse_policy_promotion_guard_v1 on public.powerhouse_policy_versions;

create trigger powerhouse_policy_promotion_guard_v1
before insert or update of decision_state,evidence,effect_snapshot
on public.powerhouse_policy_versions
for each row
execute function public.powerhouse_policy_promotion_guard_v1();

revoke execute on function public.powerhouse_policy_promotion_guard_v1() from public, anon, authenticated;

comment on function public.powerhouse_policy_promotion_guard_v1() is
  'Fail-closed canonicalization guard. Policy promotion requires the exact historical replay/shadow/canary evidence mode selected by powerhouse_learning_compiler_v1.';
