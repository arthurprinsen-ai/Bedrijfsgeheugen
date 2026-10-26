-- Evidence correction: Netlify preview metadata observed Functions in iad and Blobs in us-east-1.
-- Runtime observations are evidence samples, never residency guarantees.

update public.data_sovereignty_provider_registry_v1
set processing_scope='PLATFORM_ROUTED_UNPINNED',
    storage_scope='PLATFORM_MANAGED_UNKNOWN_REGION',
    primary_region=null,
    cross_border_transfer='POSSIBLE_OUTSIDE_EEA',
    evidence_status='PARTIAL',
    notes='Netlify compute en Blob-opslag zijn niet aantoonbaar naar de EU gepind. Previewmetadata observeerde Functions in iad en Blobs in us-east-1; observaties zijn samples, geen residencygarantie.',
    retention_summary='Function requests zijn transit; Netlify Blob-data heeft geen bewezen EU-only fysieke opslagregio.',
    updated_at=now()
where provider_key='netlify';

update public.data_sovereignty_flow_registry_v1
set processors='[{"step":1,"provider":"Netlify","component":"portal-business-input","region":"PLATFORM_ROUTED_UNPINNED"},{"step":2,"provider":"Supabase Edge","component":"brain-operating-authority","region":"eu-central-1"}]'::jsonb,
    processing_scope='MIXED_NETLIFY_UNPINNED_SUPABASE_EU',
    storage_scope='EU_FRANKFURT',
    cross_border_transfer='NETLIFY_TRANSIT_NOT_PINNED',
    evidence_status='PARTIAL',
    updated_at=now()
where flow_key='portal-business-input';

update public.data_sovereignty_flow_registry_v1
set processors='[{"step":1,"provider":"Netlify","component":"portal-state","region":"PLATFORM_ROUTED_UNPINNED"},{"step":2,"provider":"Supabase Edge","component":"portal-state-eu","region":"eu-central-1"}]'::jsonb,
    storage='[{"provider":"Supabase","service":"Postgres","region":"eu-central-1"},{"provider":"Netlify","service":"Blobs legacy fallback","region":"UNKNOWN"}]'::jsonb,
    processing_scope='MIXED_NETLIFY_UNPINNED_SUPABASE_EU',
    storage_scope='MIXED_PRIMARY_EU_LEGACY_FALLBACK_UNKNOWN',
    cross_border_transfer='NETLIFY_TRANSIT_OR_LEGACY_FALLBACK_POSSIBLE_OUTSIDE_EEA',
    evidence_status='PARTIAL',
    updated_at=now()
where flow_key='portal-state';

update public.data_sovereignty_flow_registry_v1
set processors='[{"step":1,"provider":"Netlify","component":"portal-feedback","region":"PLATFORM_ROUTED_UNPINNED"}]'::jsonb,
    storage='[{"provider":"Netlify","service":"Blobs","region":"UNKNOWN"}]'::jsonb,
    processing_scope='PLATFORM_ROUTED_UNPINNED',
    storage_scope='PLATFORM_MANAGED_UNKNOWN_REGION',
    cross_border_transfer='POSSIBLE_OUTSIDE_EEA',
    evidence_status='PARTIAL',
    updated_at=now()
where flow_key='portal-feedback';

update public.data_sovereignty_flow_registry_v1
set processors=jsonb_set(processors,'{0,region}','"PLATFORM_ROUTED_UNPINNED"'::jsonb,false),
    updated_at=now()
where flow_key in ('portal-question-ai','portal-translation','connector-ai-guide','connector-runtime')
  and jsonb_array_length(processors)>0;

update public.data_sovereignty_adapter_registry_v1
set processing_scope='PLATFORM_ROUTED_UNPINNED',
    storage_scope='PLATFORM_MANAGED_UNKNOWN_REGION',
    cross_border_transfer='POSSIBLE_OUTSIDE_EEA',
    evidence_status='PARTIAL',
    notes='Upload loopt via Netlify; compute- en Blob-residency zijn niet als EU-only bewezen.',
    updated_at=now()
where adapter_id='upload';

create or replace function public.record_data_sovereignty_provider_observation_v1(
 p_provider_key text,p_observed_region text,p_configured_storage_region text,p_source text,
 p_deploy_id text default null,p_commit_ref text default null,p_evidence jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='public' as $$
declare
 v_provider text:=nullif(trim(p_provider_key),'');
 v_region text:=upper(coalesce(nullif(trim(p_observed_region),''),'UNKNOWN'));
 v_verified boolean:=false;
 v_id uuid;
begin
 if v_provider is null then raise exception 'provider_key is required'; end if;
 if not exists(select 1 from public.data_sovereignty_provider_registry_v1 where provider_key=v_provider) then raise exception 'unknown provider'; end if;
 if v_provider='supabase' then v_verified:=v_region='EU-CENTRAL-1'; else v_verified:=false; end if;

 insert into public.data_sovereignty_provider_observations_v1(provider_key,observed_region,configured_storage_region,source,deploy_id,commit_ref,verified,evidence)
 values(v_provider,p_observed_region,p_configured_storage_region,coalesce(nullif(trim(p_source),''),'runtime'),nullif(trim(p_deploy_id),''),nullif(trim(p_commit_ref),''),v_verified,coalesce(p_evidence,'{}'::jsonb))
 returning observation_id into v_id;

 if v_provider='netlify' then
   update public.data_sovereignty_provider_registry_v1
   set processing_scope='PLATFORM_ROUTED_UNPINNED',
       storage_scope='PLATFORM_MANAGED_UNKNOWN_REGION',
       primary_region=nullif(p_observed_region,'UNKNOWN'),
       cross_border_transfer='POSSIBLE_OUTSIDE_EEA',
       evidence_status='PARTIAL',
       evidence_checked_at=now(),
       updated_at=now()
   where provider_key='netlify';
 end if;

 return jsonb_build_object(
   'observationId',v_id,'providerKey',v_provider,'verified',v_verified,
   'observedRegion',p_observed_region,'configuredStorageRegion',p_configured_storage_region,
   'guarantee',case when v_provider='netlify' then 'OBSERVATION_ONLY' else 'REGION_VERIFIED' end,
   'observedAt',now()
 );
end $$;

revoke all on function public.record_data_sovereignty_provider_observation_v1(text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_data_sovereignty_provider_observation_v1(text,text,text,text,text,text,jsonb) to service_role;

select public.refresh_data_sovereignty_snapshot_v1('canonical');
