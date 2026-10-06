-- Harden LinkedIn company terminal truth.
-- LIVE_PROVEN is allowed only with a fresh organization-admin OAuth lineage,
-- organization write capability, the canonical Bedrijfsgeheugen author and exact provider readback.

create or replace function public.enforce_linkedin_company_live_proof_v1()
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
        message='LINKEDIN_COMPANY_LIVE_PROOF_BLOCKED: fresh organization-admin OAuth + organization write scope + exact provider readback required';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists linkedin_company_live_proof_guard_v1 on public.content_publication_obligations;
create trigger linkedin_company_live_proof_guard_v1
before insert or update
on public.content_publication_obligations
for each row
execute function public.enforce_linkedin_company_live_proof_v1();

create or replace function public.reconcile_social_post_publication_obligation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
  v_channel text;
  v_status text;
  v_evidence jsonb;
  v_ob_evidence jsonb;
  v_company_live_proof boolean := false;
begin
  if new.published_at is null then
    return new;
  end if;

  v_date := (new.published_at at time zone 'Europe/Amsterdam')::date;
  v_channel := case
    when new.channel_kind in ('linkedin_personal','linkedin_company','instagram') then new.channel_kind
    when lower(coalesce(new.platform,'')) = 'instagram' then 'instagram'
    else null
  end;
  if v_channel is null then return new; end if;

  select o.status, public.powerhouse_jsonb_object_v1(o.evidence)
    into v_status, v_ob_evidence
  from public.content_publication_obligations o
  where o.tenant_id = new.tenant_id
    and o.publication_date = v_date
    and o.channel = v_channel;

  if v_status is null then return new; end if;

  if v_channel in ('linkedin_personal','instagram') then
    update public.content_publication_obligations
       set external_id = coalesce(nullif(new.external_post_id,''), external_id),
           published_at = coalesce(published_at, new.published_at),
           evidence = public.powerhouse_jsonb_object_v1(evidence) || jsonb_build_object(
             'transport_only',true,
             'identity_guard_required',true,
             'transport_source','social_posts',
             'transport_post_id',new.post_id,
             'transport_external_post_id',new.external_post_id,
             'transport_observed_at',now()
           ),
           updated_at = now()
     where tenant_id = new.tenant_id and publication_date = v_date and channel = v_channel;
    return new;
  end if;

  if v_channel='linkedin_company' then
    v_company_live_proof :=
      public.powerhouse_jsonb_true(v_ob_evidence,'provider_truth_verified')
      and public.powerhouse_jsonb_true(v_ob_evidence,'linkedin_company_admin_oauth_proven')
      and public.powerhouse_jsonb_true(v_ob_evidence,'organization_write_scope_verified')
      and public.powerhouse_jsonb_true(v_ob_evidence,'company_oauth_fresh_verified')
      and nullif(v_ob_evidence->>'company_oauth_connection_id','') is not null
      and nullif(v_ob_evidence->>'company_oauth_verified_at','') is not null
      and coalesce(v_ob_evidence->>'author_urn',v_ob_evidence->>'organization_urn','')='urn:li:organization:18234216';

    if not v_company_live_proof then
      update public.content_publication_obligations
         set external_id = coalesce(nullif(new.external_post_id,''), external_id),
             published_at = coalesce(published_at, new.published_at),
             evidence = public.powerhouse_jsonb_object_v1(evidence) || jsonb_build_object(
               'transport_only',true,
               'transport_source','social_posts',
               'transport_post_id',new.post_id,
               'transport_external_post_id',new.external_post_id,
               'transport_observed_at',now(),
               'linkedin_company_live_proof_guard','BLOCKED_PENDING_ORG_OAUTH_AND_EXACT_READBACK'
             ),
             updated_at = now()
       where tenant_id = new.tenant_id and publication_date = v_date and channel = v_channel;
      return new;
    end if;
  end if;

  if public.content_publication_state_rank(v_status) >= public.content_publication_state_rank('LIVE_PROVEN') then
    update public.content_publication_obligations
       set external_id = coalesce(nullif(new.external_post_id,''), external_id),
           published_at = coalesce(published_at, new.published_at),
           updated_at = now()
     where tenant_id = new.tenant_id and publication_date = v_date and channel = v_channel;
    return new;
  end if;

  v_evidence := jsonb_build_object(
    'source','social_posts',
    'post_id',new.post_id,
    'external_post_id',new.external_post_id,
    'channel_id',new.channel_id,
    'channel_name',new.channel_name,
    'channel_kind',v_channel,
    'published_at',new.published_at,
    'linkedin_company_live_proof_guard','PASSED'
  );

  perform public.record_content_publication_state(
    new.tenant_id,v_date,v_channel,'LIVE_PROVEN',new.post_id,null,
    coalesce(new.external_post_id,new.post_id),null,v_evidence,'{}'::jsonb,
    'Meet prestaties en schrijf outcome/learning terug.',null
  );

  update public.content_publication_obligations
     set published_at = coalesce(published_at, new.published_at), updated_at = now()
   where tenant_id = new.tenant_id and publication_date = v_date and channel = v_channel;

  return new;
end;
$$;

revoke all on function public.reconcile_social_post_publication_obligation() from public;
