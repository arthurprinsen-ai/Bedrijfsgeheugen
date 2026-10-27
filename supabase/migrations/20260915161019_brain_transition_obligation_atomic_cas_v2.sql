-- Fix recurring false STATE_VERSION_CONFLICT in the canonical obligation transition RPC.
-- Use one atomic compare-and-swap UPDATE keyed by id+version; distinguish missing rows from stale versions only after a failed CAS.

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
set search_path=public
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

  update public.brain_obligations
     set state=v_state,
         owner=coalesce(v_owner,owner),
         evidence=coalesce(v_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=v_obligation_id
     and version=v_expected_version
   returning * into v_row;

  if found then
    return v_row;
  end if;

  if not exists (
    select 1 from public.brain_obligations where id=v_obligation_id
  ) then
    raise exception 'OBLIGATION_NOT_FOUND';
  end if;

  raise exception 'STATE_VERSION_CONFLICT';
end;
$$;

revoke all on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) to service_role;
