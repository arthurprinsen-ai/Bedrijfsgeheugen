-- Hard terminal guard for LinkedIn company publication truth.
-- Applies to every write path, including direct SQL, triggers, schedulers and future publisher code.

create or replace function public.enforce_linkedin_company_live_proof_v2()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_evidence jsonb := public.powerhouse_jsonb_object_v1(new.evidence);
  v_author text := coalesce(v_evidence->>'author_urn', v_evidence->>'organization_urn', '');
begin
  if new.tenant_id='canonical'
     and new.channel='linkedin_company'
     and new.status in ('LIVE_PROVEN','MEASURED','LEARNED') then
    if not (
      nullif(coalesce(new.external_id,''),'') is not null
      and (
        coalesce(new.external_id,'') like 'urn:li:share:%'
        or coalesce(new.external_id,'') like 'urn:li:ugcPost:%'
      )
      and public.powerhouse_jsonb_true(v_evidence,'provider_truth_verified')
      and public.powerhouse_jsonb_true(v_evidence,'linkedin_company_admin_oauth_proven')
      and public.powerhouse_jsonb_true(v_evidence,'organization_write_scope_verified')
      and public.powerhouse_jsonb_true(v_evidence,'company_oauth_fresh_verified')
      and nullif(v_evidence->>'company_oauth_connection_id','') is not null
      and nullif(v_evidence->>'company_oauth_verified_at','') is not null
      and v_author='urn:li:organization:18234216'
    ) then
      raise exception using
        errcode='P0001',
        message='LINKEDIN_COMPANY_LIVE_PROOF_BLOCKED: fresh organization-admin OAuth + organization write + exact provider readback required';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_linkedin_company_live_proof_v2() from public;
revoke all on function public.enforce_linkedin_company_live_proof_v2() from anon;
revoke all on function public.enforce_linkedin_company_live_proof_v2() from authenticated;

drop trigger if exists linkedin_company_live_proof_guard_v2 on public.content_publication_obligations;
create trigger linkedin_company_live_proof_guard_v2
before insert or update
on public.content_publication_obligations
for each row
execute function public.enforce_linkedin_company_live_proof_v2();
