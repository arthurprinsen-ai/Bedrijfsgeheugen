-- Tenant-scoped desired AI deployment and data-residency profile.
-- No auto-activation: existing snapshot RPC already serializes the policy row using to_jsonb(v_policy).
alter table public.tenant_data_sovereignty_policy_v1
 add column if not exists ai_deployment_profile jsonb;
do $$
begin
 if not exists(
  select 1 from pg_constraint
  where conname='tenant_ai_deployment_profile_object_v1'
    and conrelid='public.tenant_data_sovereignty_policy_v1'::regclass
 ) then
  alter table public.tenant_data_sovereignty_policy_v1
   add constraint tenant_ai_deployment_profile_object_v1
   check (ai_deployment_profile is null or jsonb_typeof(ai_deployment_profile)='object');
 end if;
end $$;
comment on column public.tenant_data_sovereignty_policy_v1.ai_deployment_profile is
 'Tenant-selected desired AI deployment and residency profile. Not effective runtime config, provider activation, or evidence of residency.';
