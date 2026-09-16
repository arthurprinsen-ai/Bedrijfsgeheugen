-- Fix production-reproduced false STATE_VERSION_CONFLICT in the canonical obligation transition RPC.
-- The atomic CAS existed already, but unqualified target-row column references remained ambiguous in the
-- composite-returning PL/pgSQL function context. Qualify every target-row read with an UPDATE alias.

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
  v_obligation_id uuid := p_obligation_id;
  v_expected_version bigint := p_expected_version;
  v_state text := p_state;
  v_owner text := p_owner;
  v_evidence jsonb := p_evidence;
  v_row public.brain_obligations;
begin
  if v_obligation_id is null or v_expected_version is null or v_expected_version < 1
     or v_state not in ('OPEN','READY','RUNNING','BLOCKED','FULFILLED','BREACHED','CANCELLED') then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.brain_obligations as bo
     set state=v_state,
         owner=coalesce(v_owner,bo.owner),
         evidence=coalesce(v_evidence,bo.evidence),
         version=bo.version+1,
         updated_at=now()
   where bo.id=v_obligation_id
     and bo.version=v_expected_version
   returning bo.* into v_row;

  if found then
    return v_row;
  end if;

  if not exists (
    select 1
    from public.brain_obligations as bo
    where bo.id=v_obligation_id
  ) then
    raise exception 'OBLIGATION_NOT_FOUND';
  end if;

  raise exception 'STATE_VERSION_CONFLICT';
end;
$$;

revoke execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) to service_role;
