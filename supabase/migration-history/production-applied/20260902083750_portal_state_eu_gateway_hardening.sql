drop function if exists public.bg_portal_state_get(text,text,text);
drop function if exists public.bg_portal_state_put(text,text,text,jsonb);

create or replace function public.bg_portal_state_get_internal(
  p_tenant_id text,
  p_layer text
)
returns table(payload jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_layer not in ('legacy-migration','canonical-brain') then
    raise exception 'invalid layer' using errcode = '22023';
  end if;
  return query
    select s.payload
    from public.portal_state_layers s
    where s.tenant_id = p_tenant_id and s.layer = p_layer;
end;
$$;

create or replace function public.bg_portal_state_put_internal(
  p_tenant_id text,
  p_layer text,
  p_payload jsonb
)
returns table(stored boolean, stale boolean, record jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.portal_state_layers%rowtype;
  v_next_ts timestamptz;
begin
  if p_layer not in ('legacy-migration','canonical-brain') then
    raise exception 'invalid layer' using errcode = '22023';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be object' using errcode = '22023';
  end if;

  v_next_ts := coalesce(
    nullif(p_payload->>'sourceUpdatedAt','')::timestamptz,
    nullif(p_payload#>>'{data,sourceMeta,updatedAt}','')::timestamptz,
    now()
  );

  select * into v_existing
  from public.portal_state_layers
  where tenant_id = p_tenant_id and layer = p_layer
  for update;

  if found and coalesce(v_existing.source_updated_at, '-infinity'::timestamptz) >= v_next_ts then
    return query select false, true, v_existing.payload;
    return;
  end if;

  insert into public.portal_state_layers(tenant_id, layer, payload, source_updated_at, updated_at)
  values (p_tenant_id, p_layer, p_payload, v_next_ts, now())
  on conflict (tenant_id, layer) do update
    set payload = excluded.payload,
        source_updated_at = excluded.source_updated_at,
        updated_at = now();

  return query select true, false, p_payload;
end;
$$;

revoke all on function public.bg_portal_state_get_internal(text,text) from public, anon, authenticated;
revoke all on function public.bg_portal_state_put_internal(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.bg_portal_state_get_internal(text,text) to service_role;
grant execute on function public.bg_portal_state_put_internal(text,text,jsonb) to service_role;
