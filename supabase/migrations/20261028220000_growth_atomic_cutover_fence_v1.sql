-- Atomic cutover V6.1 — fence-transactie voor de growth learning-store.
-- Gebruikt de bestaande Brain-opslag (public.brain_records). Geen nieuwe tabel.
-- Epoch-staat is één governance-rij; schrijvers nemen daar FOR SHARE op, een
-- intrekking neemt FOR UPDATE. Een intrekking wacht dus op lopende schrijvers en
-- daarna wordt geen enkele schrijver met de oude staat meer geaccepteerd.

insert into public.brain_records
  (tenant_id, record_id, record_type, record_kind, subject_id, status, observed_at, provenance, payload, idempotency_key)
values
  ('bedrijfsgeheugen', 'cutover-epoch:growth-learning', 'Governance', 'governance', 'growth-learning-store', 'OBSERVED', now(),
   jsonb_build_object('source', 'migration:20261028220000_growth_atomic_cutover_fence_v1'),
   jsonb_build_object('state', 'INACTIVE', 'epoch', 1),
   'cutover-epoch:growth-learning')
on conflict do nothing;

create or replace function public.growth_insert_if_absent_with_cutover_fence(
  p_scope text, p_legacy_key text, p_key text, p_record jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_state jsonb;
  v_epoch text;
  v_type text;
  v_kind text;
  v_inserted boolean;
begin
  if p_scope = 'growth:outcome' then v_type := 'Outcome'; v_kind := 'outcome';
  elsif p_scope = 'growth:learning-event' then v_type := 'Memory'; v_kind := 'memory';
  else raise exception 'CUTOVER_SCOPE_INVALID';
  end if;
  if coalesce(btrim(p_key), '') = '' or coalesce(btrim(p_legacy_key), '') = '' or p_record is null then
    raise exception 'CUTOVER_KEY_INVALID';
  end if;

  select r.payload into v_state
    from public.brain_records r
   where r.tenant_id = 'bedrijfsgeheugen' and r.record_id = 'cutover-epoch:growth-learning'
   for share;
  if v_state is null or v_state->>'state' is distinct from 'ACTIVE' then
    raise exception 'CUTOVER_FENCE_INACTIVE';
  end if;
  v_epoch := v_state->>'epoch';

  -- Serialiseer dezelfde identiteit, ongeacht legacy- of v2-sleutel.
  perform pg_advisory_xact_lock(hashtextextended('growth-cutover:' || p_legacy_key, 0));

  if exists (select 1 from public.brain_records r
              where r.tenant_id = 'bedrijfsgeheugen' and r.idempotency_key = p_legacy_key) then
    return jsonb_build_object('status', 'LEGACY_EXISTS', 'epoch', v_epoch, 'scope', p_scope,
      'key', p_key, 'legacyKey', p_legacy_key, 'transactionVerified', true);
  end if;

  with ins as (
    insert into public.brain_records
      (tenant_id, record_id, record_type, record_kind, subject_id, status, observed_at, verified, provenance, payload, idempotency_key)
    values
      ('bedrijfsgeheugen', p_key, v_type, v_kind, p_scope, 'OBSERVED', now(),
       (p_record ? 'verifiedPaymentEvidence'),
       jsonb_build_object('source', 'growth-learning-store', 'epoch', v_epoch),
       jsonb_build_object('record', p_record), p_key)
    on conflict do nothing
    returning 1
  )
  select exists (select 1 from ins) into v_inserted;

  return jsonb_build_object('status', case when v_inserted then 'INSERTED' else 'V2_EXISTS' end,
    'epoch', v_epoch, 'scope', p_scope, 'key', p_key, 'legacyKey', p_legacy_key, 'transactionVerified', true);
end;
$$;

create or replace function public.growth_cutover_set_state(p_state text) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
begin
  if p_state not in ('ACTIVE', 'INACTIVE') then raise exception 'CUTOVER_STATE_INVALID'; end if;
  select r.payload into v_old from public.brain_records r
   where r.tenant_id = 'bedrijfsgeheugen' and r.record_id = 'cutover-epoch:growth-learning'
   for update;
  if v_old is null then raise exception 'CUTOVER_EPOCH_ROW_MISSING'; end if;
  v_new := jsonb_build_object('state', p_state, 'epoch', (v_old->>'epoch')::int + 1);
  update public.brain_records set payload = v_new, updated_at = now()
   where tenant_id = 'bedrijfsgeheugen' and record_id = 'cutover-epoch:growth-learning';
  return v_new;
end;
$$;

revoke all on function public.growth_insert_if_absent_with_cutover_fence(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.growth_cutover_set_state(text) from public, anon, authenticated;
grant execute on function public.growth_insert_if_absent_with_cutover_fence(text, text, text, jsonb) to service_role;
grant execute on function public.growth_cutover_set_state(text) to service_role;
