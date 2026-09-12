create table if not exists public.portal_state_layers (
  tenant_id text not null,
  layer text not null check (layer in ('legacy-migration','canonical-brain')),
  payload jsonb not null,
  source_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, layer)
);

alter table public.portal_state_layers enable row level security;
revoke all on table public.portal_state_layers from anon, authenticated;

create or replace function public.bg_portal_state_get(
  p_service_token text,
  p_tenant_id text,
  p_layer text
)
returns table(payload jsonb)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if encode(digest(coalesce(p_service_token,''), 'sha256'), 'hex') <> '0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75' then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_layer not in ('legacy-migration','canonical-brain') then
    raise exception 'invalid layer' using errcode = '22023';
  end if;
  return query
    select s.payload
    from public.portal_state_layers s
    where s.tenant_id = p_tenant_id and s.layer = p_layer;
end;
$$;

create or replace function public.bg_portal_state_put(
  p_service_token text,
  p_tenant_id text,
  p_layer text,
  p_payload jsonb
)
returns table(stored boolean, stale boolean, record jsonb)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_existing public.portal_state_layers%rowtype;
  v_next_ts timestamptz;
begin
  if encode(digest(coalesce(p_service_token,''), 'sha256'), 'hex') <> '0ca9abe4469bea5e83355a193662d5d9455b04f7b6f76a668755e87348eadb75' then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
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

revoke all on function public.bg_portal_state_get(text,text,text) from public;
revoke all on function public.bg_portal_state_put(text,text,text,jsonb) from public;
grant execute on function public.bg_portal_state_get(text,text,text) to anon;
grant execute on function public.bg_portal_state_put(text,text,text,jsonb) to anon;
