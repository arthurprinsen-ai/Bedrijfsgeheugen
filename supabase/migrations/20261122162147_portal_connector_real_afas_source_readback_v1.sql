-- P0 original Connector Studio: real AFAS source → private tenant snapshots → portal.
-- Do not add public RLS policies: only the original server-side service role may access.
create table if not exists public.connector_afas_credentials_v1 (
  organisatie_id uuid not null,
  connector_id uuid primary key references public.connector_definitions(id) on delete cascade,
  vault_secret_id uuid not null,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists connector_afas_credentials_v1_tenant_idx
  on public.connector_afas_credentials_v1(organisatie_id,connector_id);
alter table public.connector_afas_credentials_v1 enable row level security;
revoke all on public.connector_afas_credentials_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.connector_afas_credentials_v1 to service_role;

create table if not exists public.connector_source_snapshots_v1 (
  organisatie_id uuid not null,
  connector_id uuid not null references public.connector_definitions(id) on delete cascade,
  connector_versie integer not null check (connector_versie>0),
  provider text not null check (provider='afas'),
  get_connector text not null,
  kolommen jsonb not null check (jsonb_typeof(kolommen)='array' and jsonb_array_length(kolommen) between 1 and 40),
  rijen jsonb not null check (jsonb_typeof(rijen)='array' and jsonb_array_length(rijen) between 0 and 100),
  aantal integer not null check (aantal>=0 and aantal<=100),
  bron_hash text not null check (bron_hash ~ '^[0-9a-f]{64}$'),
  bron_gecontroleerd boolean not null default false,
  ingelezen_op timestamptz not null default now(),
  primary key (organisatie_id, connector_id)
);
create index if not exists connector_source_snapshots_v1_tenant_idx
  on public.connector_source_snapshots_v1(organisatie_id,ingelezen_op desc);
alter table public.connector_source_snapshots_v1 enable row level security;
revoke all on public.connector_source_snapshots_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.connector_source_snapshots_v1 to service_role;

-- Role-restricted functions are the ONLY way the Netlify service can read a
-- plaintext AFAS token. The credential never enters the draft or portal state.
create or replace function public.connector_afas_vault_write(
  p_organisatie_id uuid,p_connector_id uuid,p_token text
) returns boolean language plpgsql security definer
set search_path = '' as $$
declare v_id uuid;
begin
  if p_token is null or length(p_token)<35 or length(p_token)>5000 then
    raise exception 'INVALID_AFAS_CREDENTIAL';
  end if;
  if not exists (
    select 1 from public.connector_definitions
    where id=p_connector_id and organisatie_id=p_organisatie_id
  ) then raise exception 'CONNECTOR_SCOPE_INVALID'; end if;
  select vault_secret_id into v_id
    from public.connector_afas_credentials_v1
    where organisatie_id=p_organisatie_id and connector_id=p_connector_id for update;
  if v_id is null then
    v_id := vault.create_secret(p_token);
    insert into public.connector_afas_credentials_v1
      (organisatie_id,connector_id,vault_secret_id)
      values(p_organisatie_id,p_connector_id,v_id);
  else
    perform vault.update_secret(v_id,p_token);
    update public.connector_afas_credentials_v1
       set bijgewerkt_op=now() where organisatie_id=p_organisatie_id and connector_id=p_connector_id;
  end if;
  return true;
end $$;

create or replace function public.connector_afas_vault_read(
  p_organisatie_id uuid,p_connector_id uuid
) returns text language plpgsql security definer
set search_path = '' as $$
declare v_token text;
begin
  if not exists (
    select 1 from public.connector_definitions
    where id=p_connector_id and organisatie_id=p_organisatie_id
  ) then return null; end if;
  select s.decrypted_secret into v_token
  from public.connector_afas_credentials_v1 c
  join vault.decrypted_secrets s on s.id=c.vault_secret_id
  where c.organisatie_id=p_organisatie_id and c.connector_id=p_connector_id;
  return v_token;
end $$;

create or replace function public.connector_afas_vault_revoke(
  p_organisatie_id uuid,p_connector_id uuid
) returns boolean language plpgsql security definer
set search_path = '' as $$
declare v_id uuid;
begin
  select vault_secret_id into v_id from public.connector_afas_credentials_v1
  where organisatie_id=p_organisatie_id and connector_id=p_connector_id for update;
  if v_id is null then return false; end if;
  delete from public.connector_afas_credentials_v1
    where organisatie_id=p_organisatie_id and connector_id=p_connector_id;
  delete from vault.secrets where id=v_id;
  delete from public.connector_source_snapshots_v1
    where organisatie_id=p_organisatie_id and connector_id=p_connector_id;
  return true;
end $$;

revoke all on function public.connector_afas_vault_write(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.connector_afas_vault_read(uuid,uuid) from public,anon,authenticated;
revoke all on function public.connector_afas_vault_revoke(uuid,uuid) from public,anon,authenticated;
grant execute on function public.connector_afas_vault_write(uuid,uuid,text) to service_role;
grant execute on function public.connector_afas_vault_read(uuid,uuid) to service_role;
grant execute on function public.connector_afas_vault_revoke(uuid,uuid) to service_role;

comment on table public.connector_source_snapshots_v1 is
  'Original connector studio source readback: actual AFAS rows with tenant isolation and provider proof; not KPI facts.';
