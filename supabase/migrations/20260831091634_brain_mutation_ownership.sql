-- Canonical mutation ownership: exactly one ACTIVE mutator per capability/scope/environment.

create table if not exists public.brain_mutation_ownership (
  id uuid primary key default gen_random_uuid(),
  capability_id text not null,
  mutation_scope text not null,
  environment text not null,
  owner_type text not null,
  owner_ref text not null,
  mode text not null default 'ACTIVE',
  generation bigint not null default 1,
  evidence jsonb,
  acquired_at timestamptz not null default now(),
  retired_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint brain_mutation_owner_identity_nonempty check(
    length(btrim(capability_id))>0 and length(btrim(mutation_scope))>0 and length(btrim(environment))>0
    and length(btrim(owner_type))>0 and length(btrim(owner_ref))>0),
  constraint brain_mutation_owner_mode_valid check(mode in ('ACTIVE','SHADOW','RETIRED')),
  constraint brain_mutation_owner_generation_positive check(generation>=1)
);

create unique index if not exists brain_mutation_ownership_one_active
  on public.brain_mutation_ownership(capability_id,mutation_scope,environment)
  where mode='ACTIVE';

create index if not exists brain_mutation_ownership_lookup
  on public.brain_mutation_ownership(capability_id,mutation_scope,environment,mode,generation desc);

create or replace function public.brain_claim_mutation_owner(
  p_capability_id text,p_mutation_scope text,p_environment text,p_owner_type text,p_owner_ref text,p_evidence jsonb default null
) returns public.brain_mutation_ownership
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_mutation_ownership;
begin
  if nullif(btrim(p_capability_id),'') is null or nullif(btrim(p_mutation_scope),'') is null
     or nullif(btrim(p_environment),'') is null or nullif(btrim(p_owner_type),'') is null
     or nullif(btrim(p_owner_ref),'') is null then raise exception 'VALIDATION_ERROR'; end if;

  select * into v_row from public.brain_mutation_ownership
   where capability_id=p_capability_id and mutation_scope=p_mutation_scope and environment=p_environment and mode='ACTIVE'
   for update;
  if found then
    if v_row.owner_type is distinct from p_owner_type or v_row.owner_ref is distinct from p_owner_ref then
      raise exception 'MUTATION_OWNER_CONFLICT';
    end if;
    return v_row;
  end if;

  insert into public.brain_mutation_ownership(capability_id,mutation_scope,environment,owner_type,owner_ref,mode,generation,evidence)
  values(p_capability_id,p_mutation_scope,p_environment,p_owner_type,p_owner_ref,'ACTIVE',1,p_evidence)
  returning * into v_row;
  return v_row;
exception when unique_violation then
  raise exception 'MUTATION_OWNER_CONFLICT';
end; $$;

create or replace function public.brain_transfer_mutation_owner(
  p_capability_id text,p_mutation_scope text,p_environment text,p_expected_generation bigint,
  p_new_owner_type text,p_new_owner_ref text,p_evidence jsonb default null
) returns public.brain_mutation_ownership
language plpgsql security definer set search_path=public as $$
declare v_current public.brain_mutation_ownership; v_new public.brain_mutation_ownership;
begin
  if nullif(btrim(p_capability_id),'') is null or nullif(btrim(p_mutation_scope),'') is null
     or nullif(btrim(p_environment),'') is null or p_expected_generation is null or p_expected_generation<1
     or nullif(btrim(p_new_owner_type),'') is null or nullif(btrim(p_new_owner_ref),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_current from public.brain_mutation_ownership
   where capability_id=p_capability_id and mutation_scope=p_mutation_scope and environment=p_environment and mode='ACTIVE'
   for update;
  if not found then raise exception 'MUTATION_OWNER_NOT_FOUND'; end if;
  if v_current.generation is distinct from p_expected_generation then raise exception 'OWNER_GENERATION_CONFLICT'; end if;
  if v_current.owner_type=p_new_owner_type and v_current.owner_ref=p_new_owner_ref then return v_current; end if;

  update public.brain_mutation_ownership
     set mode='RETIRED',retired_at=now(),updated_at=now(),evidence=coalesce(p_evidence,evidence)
   where id=v_current.id;

  insert into public.brain_mutation_ownership(capability_id,mutation_scope,environment,owner_type,owner_ref,mode,generation,evidence)
  values(p_capability_id,p_mutation_scope,p_environment,p_new_owner_type,p_new_owner_ref,'ACTIVE',v_current.generation+1,p_evidence)
  returning * into v_new;
  return v_new;
end; $$;

create or replace function public.brain_retire_mutation_owner(
  p_capability_id text,p_mutation_scope text,p_environment text,p_expected_generation bigint,p_evidence jsonb default null
) returns public.brain_mutation_ownership
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_mutation_ownership;
begin
  select * into v_row from public.brain_mutation_ownership
   where capability_id=p_capability_id and mutation_scope=p_mutation_scope and environment=p_environment and mode='ACTIVE'
   for update;
  if not found then raise exception 'MUTATION_OWNER_NOT_FOUND'; end if;
  if v_row.generation is distinct from p_expected_generation then raise exception 'OWNER_GENERATION_CONFLICT'; end if;
  update public.brain_mutation_ownership
     set mode='RETIRED',retired_at=now(),updated_at=now(),evidence=coalesce(p_evidence,evidence)
   where id=v_row.id returning * into v_row;
  return v_row;
end; $$;

alter table public.brain_mutation_ownership enable row level security;
revoke all on table public.brain_mutation_ownership from public,anon,authenticated,service_role;
grant select on table public.brain_mutation_ownership to service_role;

revoke all on function public.brain_claim_mutation_owner(text,text,text,text,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.brain_transfer_mutation_owner(text,text,text,bigint,text,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.brain_retire_mutation_owner(text,text,text,bigint,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.brain_claim_mutation_owner(text,text,text,text,text,jsonb) to service_role;
grant execute on function public.brain_transfer_mutation_owner(text,text,text,bigint,text,text,jsonb) to service_role;
grant execute on function public.brain_retire_mutation_owner(text,text,text,bigint,jsonb) to service_role;
