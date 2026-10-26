update public.data_sovereignty_provider_registry_v1
set processing_scope='EU_FRANKFURT_CONFIGURED_RUNTIME_UNOBSERVED',
    storage_scope='EU_FRANKFURT_NEW_WRITES_LEGACY_UNVERIFIED',
    primary_region=null,
    cross_border_transfer='LEGACY_STORAGE_OR_RUNTIME_POSSIBLE_OUTSIDE_EEA',
    evidence_status='PARTIAL',
    notes='Netlify Functions zijn in netlify.toml op fra geconfigureerd en site-wide Blob stores op eu-central-1. De werkelijk actieve compute-regio wordt runtime gemeten. Bestaande Blob-data uit de eerdere defaultregio is pas EU-only na expliciete migratie- en purge-readback.',
    retention_summary='Function requests zijn transit. Nieuwe site-wide Blob reads/writes gebruiken eu-central-1; bestaande legacy blobs kunnen nog in de eerdere regio bestaan totdat migratie/purge is bewezen.',
    updated_at=now()
where provider_key='netlify';

update public.data_sovereignty_flow_registry_v1
set processors='[{"step":1,"provider":"Netlify","component":"portal-business-input","region":"fra configured; runtime observed separately"},{"step":2,"provider":"Supabase Edge","component":"brain-operating-authority","region":"eu-central-1"}]'::jsonb,
    processing_scope='EU_FRANKFURT_CONFIGURED_RUNTIME_OBSERVED_SEPARATELY',
    storage_scope='EU_FRANKFURT',
    cross_border_transfer='RUNTIME_REGION_AND_PROVIDER_EVIDENCE_REQUIRED',
    evidence_status='PARTIAL',
    updated_at=now()
where flow_key='portal-business-input';

update public.data_sovereignty_flow_registry_v1
set processors='[{"step":1,"provider":"Netlify","component":"portal-state","region":"fra configured; runtime observed separately"},{"step":2,"provider":"Supabase Edge","component":"portal-state-eu","region":"eu-central-1"}]'::jsonb,
    storage='[{"provider":"Supabase","service":"Postgres","region":"eu-central-1"},{"provider":"Netlify","service":"Blobs fallback","region":"eu-central-1 for new reads/writes; legacy residency unverified"}]'::jsonb,
    processing_scope='EU_FRANKFURT_CONFIGURED_RUNTIME_OBSERVED_SEPARATELY',
    storage_scope='EU_PRIMARY_WITH_LEGACY_BLOB_RESIDENCY_UNVERIFIED',
    cross_border_transfer='LEGACY_STORAGE_OR_RUNTIME_EVIDENCE_REQUIRED',
    evidence_status='PARTIAL',
    retention_summary='Supabase is EU-primary. Nieuwe fallback Blob reads/writes zijn eu-central-1; oude Blob-kopieën worden niet als EU-only beschouwd totdat migratie en purge zijn bewezen.',
    updated_at=now()
where flow_key='portal-state';

update public.data_sovereignty_flow_registry_v1
set processors='[{"step":1,"provider":"Netlify","component":"portal-feedback","region":"fra configured; runtime observed separately"}]'::jsonb,
    storage='[{"provider":"Netlify","service":"Blobs","region":"eu-central-1 for new reads/writes; legacy residency unverified"}]'::jsonb,
    processing_scope='EU_FRANKFURT_CONFIGURED_RUNTIME_OBSERVED_SEPARATELY',
    storage_scope='EU_FRANKFURT_NEW_WRITES_LEGACY_UNVERIFIED',
    cross_border_transfer='LEGACY_STORAGE_OR_RUNTIME_EVIDENCE_REQUIRED',
    evidence_status='PARTIAL',
    retention_summary='Nieuwe feedback writes gebruiken eu-central-1. Eventuele historische Blob-kopieën uit de eerdere defaultregio blijven een residency-blocker totdat migratie/purge is bewezen.',
    updated_at=now()
where flow_key='portal-feedback';

update public.data_sovereignty_flow_registry_v1
set processors=jsonb_set(processors,'{0,region}','"fra configured; runtime observed separately"'::jsonb,false),
    updated_at=now()
where flow_key in ('portal-question-ai','portal-translation','connector-ai-guide','connector-runtime')
  and jsonb_array_length(processors)>0;

update public.data_sovereignty_adapter_registry_v1
set processing_scope='EU_FRANKFURT_CONFIGURED_RUNTIME_OBSERVED_SEPARATELY',
    storage_scope='TARGET_DEPENDENT_OR_TRANSIENT',
    cross_border_transfer='RUNTIME_AND_TARGET_EVIDENCE_REQUIRED',
    evidence_status='PARTIAL',
    notes='Uploadverwerking is op Netlify fra geconfigureerd. De werkelijk actieve compute-regio en het gekozen doel bepalen of de volledige route EU-only is.',
    evidence_urls=array['https://docs.netlify.com/build/functions/configuration/'],
    updated_at=now()
where adapter_id='upload';

create or replace function public.record_data_sovereignty_provider_observation_v1(
 p_provider_key text,p_observed_region text,p_configured_storage_region text,p_source text,
 p_deploy_id text default null,p_commit_ref text default null,p_evidence jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare
 v_provider text:=nullif(trim(p_provider_key),'');
 v_region text:=lower(coalesce(nullif(trim(p_observed_region),''),'unknown'));
 v_storage text:=lower(coalesce(nullif(trim(p_configured_storage_region),''),'unknown'));
 v_compute_eu boolean:=false;
 v_storage_eu boolean:=false;
 v_legacy_migrated boolean:=false;
 v_verified boolean:=false;
 v_id uuid;
begin
 if v_provider is null then raise exception 'provider_key is required'; end if;
 if not exists(select 1 from public.data_sovereignty_provider_registry_v1 where provider_key=v_provider) then raise exception 'unknown provider'; end if;

 if v_provider='supabase' then
   v_verified:=upper(v_region)='EU-CENTRAL-1';
 elsif v_provider='netlify' then
   v_compute_eu:=v_region in ('fra','eu-central-1');
   v_storage_eu:=v_storage='eu-central-1';
   v_legacy_migrated:=coalesce(p_evidence->>'legacyStorageState','')='MIGRATED_AND_PURGED';
   v_verified:=v_compute_eu and v_storage_eu and v_legacy_migrated;
 end if;

 insert into public.data_sovereignty_provider_observations_v1
   (provider_key,observed_region,configured_storage_region,source,deploy_id,commit_ref,verified,evidence)
 values(
   v_provider,p_observed_region,p_configured_storage_region,coalesce(nullif(trim(p_source),''),'runtime'),
   nullif(trim(p_deploy_id),''),nullif(trim(p_commit_ref),''),v_verified,coalesce(p_evidence,'{}'::jsonb)
 )
 returning observation_id into v_id;

 if v_provider='netlify' then
  update public.data_sovereignty_provider_registry_v1
  set processing_scope=case
        when v_compute_eu then 'EU_FRANKFURT_RUNTIME_OBSERVED'
        else 'RUNTIME_REGION_'||upper(v_region)
      end,
      storage_scope=case
        when v_storage_eu and v_legacy_migrated then 'EU_FRANKFURT_VERIFIED'
        when v_storage_eu then 'EU_FRANKFURT_NEW_WRITES_LEGACY_UNVERIFIED'
        else 'STORAGE_REGION_'||upper(v_storage)
      end,
      primary_region=nullif(p_observed_region,'UNKNOWN'),
      cross_border_transfer=case when v_verified then 'NO_BY_DESIGN' else 'LEGACY_STORAGE_OR_RUNTIME_POSSIBLE_OUTSIDE_EEA' end,
      evidence_status=case
        when v_verified then 'VERIFIED'
        when v_compute_eu and v_storage_eu then 'PARTIAL'
        else 'STALE'
      end,
      evidence_checked_at=now(),
      notes=case
        when v_verified then 'Frankfurt compute en eu-central-1 Blob-opslag zijn gemeten/geconfigureerd en legacy Blob-data is aantoonbaar gemigreerd en uit de oude regio verwijderd.'
        when v_compute_eu and v_storage_eu then 'Frankfurt compute is runtime waargenomen en nieuwe Blob reads/writes zijn eu-central-1; legacy Blob-residency is nog niet gemigreerd/gepurged en blijft daarom fail-closed.'
        else 'De actuele runtime/storage-observatie voldoet niet aan het EU-residencycontract.'
      end,
      updated_at=now()
  where provider_key='netlify';
 end if;

 return jsonb_build_object(
   'observationId',v_id,'providerKey',v_provider,'verified',v_verified,
   'observedRegion',p_observed_region,'configuredStorageRegion',p_configured_storage_region,
   'computeEu',v_compute_eu,'storageEu',v_storage_eu,'legacyMigratedAndPurged',v_legacy_migrated,
   'observedAt',now()
 );
end
$$;
revoke all on function public.record_data_sovereignty_provider_observation_v1(text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_data_sovereignty_provider_observation_v1(text,text,text,text,text,text,jsonb) to service_role;

select public.refresh_data_sovereignty_snapshot_v1('canonical');
