-- One canonical tenant change event, atomically persisted with the sovereignty policy.
-- ESRS candidates indicate that a scope/materiality review is needed, not that CSRD applies.
alter table public.tenant_data_sovereignty_policy_v1
  add column if not exists last_change_impact jsonb;
comment on column public.tenant_data_sovereignty_policy_v1.last_change_impact is
 'Last cross-domain AI or data sovereignty change review; REVIEW_REQUIRED is not verified runtime activation, measured ESG impact, or CSRD applicability.';

create table if not exists public.tenant_data_sovereignty_change_impact_v1 (
  tenant_id text not null,
  change_id text not null,
  policy_version integer not null,
  assessment jsonb not null,
  recorded_at timestamptz not null default now(),
  primary key (tenant_id,change_id),
  constraint tenant_data_sovereignty_change_impact_object_v1 check (jsonb_typeof(assessment)='object'),
  constraint tenant_data_sovereignty_change_impact_version_v1 check (policy_version>0)
);
create index if not exists tenant_data_sovereignty_change_impact_time_v1
  on public.tenant_data_sovereignty_change_impact_v1(tenant_id,recorded_at desc);
alter table public.tenant_data_sovereignty_change_impact_v1 enable row level security;
revoke all on public.tenant_data_sovereignty_change_impact_v1 from public,anon,authenticated;
grant select on public.tenant_data_sovereignty_change_impact_v1 to service_role;

create or replace function public.record_sovereignty_change_impact_v1()
returns trigger language plpgsql security definer
set search_path=public,pg_temp as $$
begin
  if new.last_change_impact is not null
     and (tg_op='INSERT' or old.last_change_impact is distinct from new.last_change_impact) then
    if new.last_change_impact->>'tenantId' is distinct from new.tenant_id
       or new.last_change_impact->>'contract' is distinct from 'powerhouse-cross-domain-change-v1'
       or new.last_change_impact->>'status' is distinct from 'REVIEW_REQUIRED'
       or new.last_change_impact->>'changeId' is distinct from ('sovereignty:'||new.tenant_id||':'||new.policy_version::text)
       or coalesce(new.last_change_impact->>'deploymentApproved','') <> 'false' then
      raise exception 'INVALID_CROSS_DOMAIN_IMPACT' using errcode='22023';
    end if;
    insert into public.tenant_data_sovereignty_change_impact_v1
      (tenant_id,change_id,policy_version,assessment)
    values(new.tenant_id,new.last_change_impact->>'changeId',new.policy_version,new.last_change_impact);
  end if;
  return new;
end $$;
revoke all on function public.record_sovereignty_change_impact_v1() from public,anon,authenticated;
drop trigger if exists tenant_sovereignty_change_impact_v1 on public.tenant_data_sovereignty_policy_v1;
create trigger tenant_sovereignty_change_impact_v1
after insert or update of last_change_impact on public.tenant_data_sovereignty_policy_v1
for each row execute function public.record_sovereignty_change_impact_v1();
