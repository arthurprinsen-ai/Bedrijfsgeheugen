-- Production recovery v6 for false STATE_VERSION_CONFLICT in the canonical obligation transition RPC.
-- Remove local copies of CAS inputs and bind the UPDATE predicate directly to uniquely named function parameters.

create or replace function public.brain_transition_obligation(
  p_obligation_id uuid,
  p_expected_version bigint,
  p_state text,
  p_owner text default null,
  p_evidence jsonb default null
)
returns public.brain_obligations
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row public.brain_obligations;
  v_affected bigint := 0;
begin
  if p_obligation_id is null or p_expected_version is null or p_expected_version < 1
     or p_state not in ('OPEN','READY','RUNNING','BLOCKED','FULFILLED','BREACHED','CANCELLED') then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.brain_obligations as bo
     set state=p_state,
         owner=coalesce(p_owner,bo.owner),
         evidence=coalesce(p_evidence,bo.evidence),
         version=bo.version+1,
         updated_at=now()
   where bo.id=p_obligation_id
     and bo.version=p_expected_version;

  get diagnostics v_affected = row_count;

  if v_affected = 1 then
    select bo.*
      into v_row
      from public.brain_obligations as bo
     where bo.id=p_obligation_id;
    return v_row;
  end if;

  if not exists (
    select 1
      from public.brain_obligations as bo
     where bo.id=p_obligation_id
  ) then
    raise exception 'OBLIGATION_NOT_FOUND';
  end if;

  raise exception 'STATE_VERSION_CONFLICT';
end;
$$;

revoke execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) to service_role;
