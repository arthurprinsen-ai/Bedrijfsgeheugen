-- The full loop is a contract, not a best-effort sequence: every stage must be evidenced in order.
create or replace function public.powerhouse_validate_cycle_event_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_previous public.powerhouse_cycle_events%rowtype;
  v_rank integer;
  v_previous_rank integer;
begin
  if new.tenant_id is null or btrim(new.tenant_id) = '' then
    raise exception 'tenant_id is required';
  end if;
  if new.evidence_ref is null or btrim(new.evidence_ref) = '' then
    raise exception 'evidence_ref is required';
  end if;

  select * into v_previous
  from public.powerhouse_cycle_events
  where tenant_id = new.tenant_id and cycle_id = new.cycle_id
  order by sequence_no desc
  limit 1;

  if found then
    if new.sequence_no <> v_previous.sequence_no + 1 then
      raise exception 'cycle sequence must be contiguous';
    end if;
    v_rank := public.powerhouse_cycle_stage_rank_v1(new.stage);
    v_previous_rank := public.powerhouse_cycle_stage_rank_v1(v_previous.stage);
    if v_rank is null or v_rank <> v_previous_rank + 1 then
      raise exception 'cycle stage must advance exactly one canonical stage';
    end if;
  elsif new.sequence_no <> 1 or new.stage <> 'signal' then
    raise exception 'first cycle event must be signal sequence 1';
  end if;
  return new;
end;
$$;
