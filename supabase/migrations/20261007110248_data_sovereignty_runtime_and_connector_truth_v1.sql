create table if not exists public.data_sovereignty_flow_registry_v1 (
  flow_key text primary key,
  display_name text not null,
  applies_to text not null check (applies_to in ('ALL_CUSTOMERS','BEDRIJFSGEHEUGEN','WHEN_ENABLED')),
  purpose text not null,
  input_data text[] not null default '{}',
  processors jsonb not null default '[]'::jsonb,
  storage jsonb not null default '[]'::jsonb,
  provider_keys text[] not null default '{}',
  processing_scope text not null,
  storage_scope text not null,
  cross_border_transfer text not null,
  retention_summary text,
  evidence_urls text[] not null default '{}',
  evidence_status text not null default 'UNKNOWN' check (evidence_status in ('VERIFIED','PARTIAL','UNKNOWN','STALE')),
  customer_visible boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.data_sovereignty_flow_registry_v1 enable row level security;
revoke all on public.data_sovereignty_flow_registry_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.data_sovereignty_flow_registry_v1 to service_role;

create table if not exists public.data_sovereignty_adapter_registry_v1 (
  adapter_id text primary key,
  display_name text not null,
  provider_key text,
  processing_scope text not null,
  storage_scope text not null,
  cross_border_transfer text not null,
  evidence_status text not null default 'UNKNOWN' check (evidence_status in ('VERIFIED','PARTIAL','UNKNOWN','STALE')),
  notes text,
  evidence_urls text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.data_sovereignty_adapter_registry_v1 enable row level security;
revoke all on public.data_sovereignty_adapter_registry_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.data_sovereignty_adapter_registry_v1 to service_role;

create table if not exists public.data_sovereignty_provider_observations_v1 (
  observation_id uuid primary key default gen_random_uuid(),
  provider_key text not null references public.data_sovereignty_provider_registry_v1(provider_key) on update cascade on delete cascade,
  observed_region text,
  configured_storage_region text,
  source text not null,
  deploy_id text,
  commit_ref text,
  verified boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);
create index if not exists data_sovereignty_provider_observations_v1_provider_time_idx
  on public.data_sovereignty_provider_observations_v1(provider_key,observed_at desc);
alter table public.data_sovereignty_provider_observations_v1 enable row level security;
revoke all on public.data_sovereignty_provider_observations_v1 from public,anon,authenticated;
grant select,insert on public.data_sovereignty_provider_observations_v1 to service_role;

alter table public.data_sovereignty_snapshot_v1
  add column if not exists data_flows jsonb not null default '[]'::jsonb,
  add column if not exists connectors jsonb not null default '[]'::jsonb;

insert into public.data_sovereignty_flow_registry_v1
(flow_key,display_name,applies_to,purpose,input_data,processors,storage,provider_keys,processing_scope,storage_scope,cross_border_transfer,retention_summary,evidence_urls,evidence_status)
values
('portal-business-input','Bedrijfsgegevens invoeren','ALL_CUSTOMERS','Bedrijfscontext opslaan en beschikbaar maken voor het tenantgebonden Bedrijfsgeheugen',
 array['business_context','portal_input'],
 '[{"step":1,"provider":"Netlify","component":"portal-business-input","region":"fra"},{"step":2,"provider":"Supabase Edge","component":"brain-operating-authority","region":"eu-central-1"}]'::jsonb,
 '[{"provider":"Supabase","service":"Postgres","region":"eu-central-1"}]'::jsonb,
 array['netlify','supabase'],'EU_FRANKFURT_CONFIGURED','EU_FRANKFURT','NO_BY_DESIGN',
 'Canonieke bedrijfsdata blijft in de tenantgebonden Supabase-datalaag; bewaartermijnen zijn per recordtype/policy te bewijzen.',
 array['https://docs.netlify.com/build/functions/configuration/','https://supabase.com/docs/guides/functions/regional-invocation','https://supabase.com/docs/guides/platform/regions'],'PARTIAL'),
('portal-state','Klantportaal state','ALL_CUSTOMERS','Tenantgebonden portalstate lezen en schrijven',
 array['business_context','portal_state'],
 '[{"step":1,"provider":"Netlify","component":"portal-state","region":"fra"},{"step":2,"provider":"Supabase Edge","component":"portal-state-eu","region":"eu-central-1"}]'::jsonb,
 '[{"provider":"Supabase","service":"Postgres","region":"eu-central-1"},{"provider":"Netlify","service":"Blobs fallback","region":"eu-central-1"}]'::jsonb,
 array['netlify','supabase'],'EU_FRANKFURT_CONFIGURED','EU_FRANKFURT_CONFIGURED','NO_BY_DESIGN',
 'Supabase is EU-primary; legacy fallback blobs worden expliciet in Frankfurt geopend.',
 array['https://docs.netlify.com/build/data-and-storage/netlify-blobs/','https://supabase.com/docs/guides/platform/regions'],'PARTIAL'),
('portal-feedback','Feedback in klantportaal','ALL_CUSTOMERS','Gebruikersfeedback opslaan voor verbetering en opvolging',
 array['feedback','portal_context'],
 '[{"step":1,"provider":"Netlify","component":"portal-feedback","region":"fra"}]'::jsonb,
 '[{"provider":"Netlify","service":"Blobs","region":"eu-central-1"}]'::jsonb,
 array['netlify'],'EU_FRANKFURT_CONFIGURED','EU_FRANKFURT_CONFIGURED','NO_BY_DESIGN',
 'Site-wide Blob store is in code expliciet op eu-central-1 gezet.',
 array['https://docs.netlify.com/build/data-and-storage/netlify-blobs/'],'PARTIAL'),
('portal-question-ai','AI-vraag over eigen bedrijf','ALL_CUSTOMERS','Een vraag beantwoorden met tenantgebonden bedrijfscontext',
 array['business_context','question'],
 '[{"step":1,"provider":"Netlify","component":"portaalvraag","region":"fra"},{"step":2,"provider":"Anthropic","component":"AI inference","region":"global"}]'::jsonb,
 '[]'::jsonb,array['netlify','anthropic'],'GLOBAL_AI_ROUTE','NO_PROVIDER_MEMORY_BY_APP','POSSIBLE_OUTSIDE_EEA',
 'Bedrijfsgeheugen vraagt geen provider-memory; providerretentie en contractevidence blijven afzonderlijk zichtbaar.',
 array['https://docs.netlify.com/build/functions/configuration/'],'PARTIAL'),
('portal-translation','Vertalen van portaltekst','ALL_CUSTOMERS','Zichtbare portaltekst vertalen op verzoek van de gebruiker',
 array['visible_portal_text'],
 '[{"step":1,"provider":"Netlify","component":"i18n-translate","region":"fra"},{"step":2,"provider":"Anthropic","component":"AI inference","region":"global"}]'::jsonb,
 '[]'::jsonb,array['netlify','anthropic'],'GLOBAL_AI_ROUTE','NO_PROVIDER_MEMORY_BY_APP','POSSIBLE_OUTSIDE_EEA',
 'Alleen zichtbare geselecteerde tekst wordt naar de AI-route gestuurd.',
 array['https://docs.netlify.com/build/functions/configuration/'],'PARTIAL'),
('connector-ai-guide','AI-hulp bij koppeling configureren','ALL_CUSTOMERS','Koppelingen voorstellen zonder credentials of activatiebeslissing',
 array['connector_intent','technical_context'],
 '[{"step":1,"provider":"Netlify","component":"connector-ai-guide","region":"fra"},{"step":2,"provider":"Anthropic","component":"AI inference","region":"global"}]'::jsonb,
 '[]'::jsonb,array['netlify','anthropic'],'GLOBAL_AI_ROUTE','NO_PROVIDER_MEMORY_BY_APP','POSSIBLE_OUTSIDE_EEA',
 'Credentials en secrets worden uit de AI-context geweerd; safe-test blijft verplicht.',
 array['https://docs.netlify.com/build/functions/configuration/'],'PARTIAL'),
('connector-runtime','Actieve klantkoppelingen','WHEN_ENABLED','Gegevens ophalen, transformeren en doorzetten via door de klant gekozen adapters',
 array['connector_selected_data'],
 '[{"step":1,"provider":"Netlify","component":"portal-connectors","region":"fra"},{"step":2,"provider":"Configured adapter","component":"source/target","region":"adapter-dependent"}]'::jsonb,
 '[{"provider":"Supabase","service":"execution evidence","region":"eu-central-1"}]'::jsonb,
 array['netlify','supabase'],'ADAPTER_DEPENDENT','ADAPTER_DEPENDENT','ADAPTER_DEPENDENT',
 'Per actieve koppeling worden bron, doel en residency-evidence automatisch in de sovereignty snapshot opgenomen.',
 array['https://docs.netlify.com/build/functions/configuration/'],'PARTIAL'),
('github-source-control','Broncode, CI en release-evidence','BEDRIJFSGEHEUGEN','Ontwikkeling, versiebeheer en delivery evidence',
 array['source_code','ci_metadata','release_evidence'],
 '[{"step":1,"provider":"GitHub","component":"GitHub.com","region":"default US unless GHE.com data residency"}]'::jsonb,
 '[{"provider":"GitHub","service":"repository/actions metadata","region":"default GitHub.com USA"}]'::jsonb,
 array['github'],'US_DEFAULT_GITHUB_COM','US_DEFAULT_GITHUB_COM','POSSIBLE_OUTSIDE_EEA',
 'Geen klant-runtime-invoer als standaard datastroom.',
 array['https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency'],'PARTIAL'),
('notion-knowledge-sync','Notion kennis/sync','BEDRIJFSGEHEUGEN','Interne kennis en content synchroniseren waar geconfigureerd',
 array['internal_knowledge','content_context'],
 '[{"step":1,"provider":"Notion","component":"workspace/API","region":"workspace-dependent"}]'::jsonb,
 '[{"provider":"Notion","service":"workspace","region":"workspace-dependent"}]'::jsonb,
 array['notion'],'WORKSPACE_DEPENDENT','WORKSPACE_DEPENDENT','DEPENDS_ON_WORKSPACE_AND_INTEGRATION',
 'Werkelijke workspace-regio moet als evidence worden gekoppeld.',
 array['https://www.notion.com/help/data-residency'],'PARTIAL')
on conflict (flow_key) do update set
 display_name=excluded.display_name,applies_to=excluded.applies_to,purpose=excluded.purpose,input_data=excluded.input_data,
 processors=excluded.processors,storage=excluded.storage,provider_keys=excluded.provider_keys,processing_scope=excluded.processing_scope,
 storage_scope=excluded.storage_scope,cross_border_transfer=excluded.cross_border_transfer,retention_summary=excluded.retention_summary,
 evidence_urls=excluded.evidence_urls,evidence_status=excluded.evidence_status,updated_at=now();

insert into public.data_sovereignty_adapter_registry_v1
(adapter_id,display_name,provider_key,processing_scope,storage_scope,cross_border_transfer,evidence_status,notes,evidence_urls)
values
('supabase','Supabase / Postgres','supabase','EU_FRANKFURT','EU_FRANKFURT','NO_BY_DESIGN','VERIFIED','Bedrijfsgeheugen projectregio eu-central-1.',array['https://supabase.com/docs/guides/platform/regions']),
('datahub','Bedrijfsgeheugen Datahub','supabase','EU_FRANKFURT','EU_FRANKFURT','NO_BY_DESIGN','VERIFIED','Canonieke Datahub op dezelfde Supabase EU-authority.',array['https://supabase.com/docs/guides/platform/regions']),
('static','Vaste tenanttabel','supabase','EU_FRANKFURT','EU_FRANKFURT','NO_BY_DESIGN','VERIFIED','Interne tenanttabel in Supabase EU.',array['https://supabase.com/docs/guides/platform/regions']),
('upload','Bestandsupload','netlify','EU_FRANKFURT_CONFIGURED','EU_FRANKFURT_CONFIGURED','NO_BY_DESIGN','PARTIAL','Compute en Blob-opslag zijn EU-geconfigureerd; runtime-proof bepaalt VERIFIED.',array['https://docs.netlify.com/build/functions/configuration/','https://docs.netlify.com/build/data-and-storage/netlify-blobs/']),
('email','E-mail / gedeelde mailbox',null,'TENANT_PROVIDER_DEPENDENT','TENANT_PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Locatie hangt af van de door de klant gekoppelde mailprovider en tenantconfiguratie.',array[]::text[]),
('sharepoint','SharePoint / Teams',null,'TENANT_PROVIDER_DEPENDENT','TENANT_PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Microsoft tenantregio en connectorconfiguratie moeten worden bewezen.',array[]::text[]),
('power-automate','Power Automate',null,'TENANT_PROVIDER_DEPENDENT','TENANT_PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Microsoft tenantregio en connectorconfiguratie moeten worden bewezen.',array[]::text[]),
('afas-get','AFAS GetConnector',null,'PROVIDER_DEPENDENT','PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Residency-evidence wordt per provider/contract gekoppeld.',array[]::text[]),
('afas','AFAS',null,'PROVIDER_DEPENDENT','PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Residency-evidence wordt per provider/contract gekoppeld.',array[]::text[]),
('exact','Exact Online',null,'PROVIDER_DEPENDENT','PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Residency-evidence wordt per provider/contract gekoppeld.',array[]::text[]),
('api','API',null,'CUSTOM_ENDPOINT','CUSTOM_ENDPOINT','UNKNOWN','UNKNOWN','Regio hangt af van het geconfigureerde endpoint.',array[]::text[]),
('rest','REST API',null,'CUSTOM_ENDPOINT','CUSTOM_ENDPOINT','UNKNOWN','UNKNOWN','Regio hangt af van het geconfigureerde endpoint.',array[]::text[]),
('webhook','Webhook',null,'CUSTOM_ENDPOINT','CUSTOM_ENDPOINT','UNKNOWN','UNKNOWN','Regio hangt af van het geconfigureerde endpoint.',array[]::text[]),
('sftp','SFTP / file drop',null,'CUSTOM_ENDPOINT','CUSTOM_ENDPOINT','UNKNOWN','UNKNOWN','Regio hangt af van de geconfigureerde host.',array[]::text[]),
('database','Database event',null,'CUSTOM_ENDPOINT','CUSTOM_ENDPOINT','UNKNOWN','UNKNOWN','Regio hangt af van de geconfigureerde database.',array[]::text[]),
('sql','SQL database',null,'CUSTOM_ENDPOINT','CUSTOM_ENDPOINT','UNKNOWN','UNKNOWN','Regio hangt af van de geconfigureerde database.',array[]::text[]),
('make','Make',null,'PROVIDER_DEPENDENT','PROVIDER_DEPENDENT','UNKNOWN','UNKNOWN','Residency-evidence is nog niet aan deze adapter gekoppeld.',array[]::text[])
on conflict (adapter_id) do update set
 display_name=excluded.display_name,provider_key=excluded.provider_key,processing_scope=excluded.processing_scope,
 storage_scope=excluded.storage_scope,cross_border_transfer=excluded.cross_border_transfer,evidence_status=excluded.evidence_status,
 notes=excluded.notes,evidence_urls=excluded.evidence_urls,updated_at=now();

create or replace function public.record_data_sovereignty_provider_observation_v1(
 p_provider_key text,p_observed_region text,p_configured_storage_region text,p_source text,
 p_deploy_id text default null,p_commit_ref text default null,p_evidence jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path='public' as $$
declare
 v_provider text:=nullif(trim(p_provider_key),''); v_region text:=upper(coalesce(nullif(trim(p_observed_region),''),'UNKNOWN'));
 v_storage text:=lower(coalesce(nullif(trim(p_configured_storage_region),''),'unknown')); v_verified boolean:=false; v_id uuid;
begin
 if v_provider is null then raise exception 'provider_key is required'; end if;
 if not exists(select 1 from public.data_sovereignty_provider_registry_v1 where provider_key=v_provider) then raise exception 'unknown provider'; end if;
 if v_provider='netlify' then v_verified:=v_region in ('EU-CENTRAL-1','FRA') and v_storage='eu-central-1';
 elsif v_provider='supabase' then v_verified:=v_region='EU-CENTRAL-1'; end if;
 insert into public.data_sovereignty_provider_observations_v1(provider_key,observed_region,configured_storage_region,source,deploy_id,commit_ref,verified,evidence)
 values(v_provider,p_observed_region,p_configured_storage_region,coalesce(nullif(trim(p_source),''),'runtime'),nullif(trim(p_deploy_id),''),nullif(trim(p_commit_ref),''),v_verified,coalesce(p_evidence,'{}'::jsonb))
 returning observation_id into v_id;
 if v_provider='netlify' then
  update public.data_sovereignty_provider_registry_v1 set
   processing_scope=case when v_verified then 'EU_FRANKFURT_VERIFIED' else 'RUNTIME_REGION_'||v_region end,
   storage_scope=case when v_storage='eu-central-1' then 'EU_FRANKFURT_CONFIGURED' else 'RUNTIME_STORAGE_'||upper(v_storage) end,
   primary_region=p_observed_region,evidence_status=case when v_verified then 'VERIFIED' else 'STALE' end,evidence_checked_at=now(),
   notes=case when v_verified then 'Runtime-observation bevestigt Frankfurt compute; productiecode configureert site-wide Blobs op eu-central-1.'
    else 'Runtime-observation voldoet niet aan de EU-only Netlify-regiocontracten.' end,updated_at=now()
  where provider_key=v_provider;
 end if;
 return jsonb_build_object('observationId',v_id,'providerKey',v_provider,'verified',v_verified,'observedRegion',p_observed_region,'configuredStorageRegion',p_configured_storage_region,'observedAt',now());
end $$;
revoke all on function public.record_data_sovereignty_provider_observation_v1(text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_data_sovereignty_provider_observation_v1(text,text,text,text,text,text,jsonb) to service_role;

create or replace function public.refresh_data_sovereignty_snapshot_v1(p_tenant_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare
 v_tenant text:=nullif(trim(p_tenant_id),''); v_policy public.tenant_data_sovereignty_policy_v1%rowtype;
 v_providers jsonb:='[]'::jsonb; v_ai jsonb:='[]'::jsonb; v_flows jsonb:='[]'::jsonb; v_connectors jsonb:='[]'::jsonb;
 v_violations jsonb:='[]'::jsonb; v_summary jsonb:='{}'::jsonb; v_result jsonb; v_global_count integer:=0;
begin
 if v_tenant is null then raise exception 'tenant_id is required'; end if;
 insert into public.tenant_data_sovereignty_policy_v1(tenant_id,updated_by) values(v_tenant,'automatic-default') on conflict (tenant_id) do nothing;
 select * into v_policy from public.tenant_data_sovereignty_policy_v1 where tenant_id=v_tenant;

 select coalesce(jsonb_agg(jsonb_build_object(
  'providerKey',r.provider_key,'name',r.display_name,'serviceKind',r.service_kind,'customerDataExposure',r.customer_data_exposure,
  'storageScope',r.storage_scope,'processingScope',r.processing_scope,'primaryRegion',r.primary_region,'crossBorderTransfer',r.cross_border_transfer,
  'trainingUse',r.training_use,'retention',r.retention_summary,'subprocessors',r.subprocessors,'evidenceUrls',r.evidence_urls,
  'evidenceStatus',r.evidence_status,'evidenceCheckedAt',r.evidence_checked_at,'runtimeStatus',r.runtime_status,'notes',r.notes
 ) order by r.display_name),'[]'::jsonb) into v_providers from public.data_sovereignty_provider_registry_v1 r where r.customer_visible=true;

 select coalesce(jsonb_agg(jsonb_build_object(
  'flowKey',f.flow_key,'name',f.display_name,'appliesTo',f.applies_to,'purpose',f.purpose,'inputData',f.input_data,
  'processors',f.processors,'storage',f.storage,'providerKeys',f.provider_keys,'processingScope',f.processing_scope,
  'storageScope',f.storage_scope,'crossBorderTransfer',f.cross_border_transfer,'retention',f.retention_summary,
  'evidenceUrls',f.evidence_urls,'evidenceStatus',f.evidence_status
 ) order by f.display_name),'[]'::jsonb) into v_flows
 from public.data_sovereignty_flow_registry_v1 f
 where f.customer_visible=true and (f.applies_to='ALL_CUSTOMERS' or (v_tenant='canonical' and f.applies_to='BEDRIJFSGEHEUGEN') or f.applies_to='WHEN_ENABLED');

 select coalesce(jsonb_agg(jsonb_build_object(
  'id',c.id,'name',c.naam,'templateId',c.template_id,'status',c.status,'version',c.versie,'updatedAt',c.bijgewerkt_op,
  'sourceType',coalesce(c.configuratie#>>'{source,type}','UNKNOWN'),'targetType',coalesce(c.configuratie#>>'{target,type}','UNKNOWN'),
  'sourceResidency',case when sr.adapter_id is null then null else jsonb_build_object('adapterId',sr.adapter_id,'name',sr.display_name,'providerKey',sr.provider_key,'processingScope',sr.processing_scope,'storageScope',sr.storage_scope,'crossBorderTransfer',sr.cross_border_transfer,'evidenceStatus',sr.evidence_status,'notes',sr.notes) end,
  'targetResidency',case when tr.adapter_id is null then null else jsonb_build_object('adapterId',tr.adapter_id,'name',tr.display_name,'providerKey',tr.provider_key,'processingScope',tr.processing_scope,'storageScope',tr.storage_scope,'crossBorderTransfer',tr.cross_border_transfer,'evidenceStatus',tr.evidence_status,'notes',tr.notes) end
 ) order by c.bijgewerkt_op desc),'[]'::jsonb) into v_connectors
 from public.connector_definitions c
 left join public.data_sovereignty_adapter_registry_v1 sr on sr.adapter_id=coalesce(c.configuratie#>>'{source,type}','')
 left join public.data_sovereignty_adapter_registry_v1 tr on tr.adapter_id=coalesce(c.configuratie#>>'{target,type}','')
 where c.organisatie_id::text=v_tenant;

 select coalesce(jsonb_agg(jsonb_build_object(
  'useCaseId',g.use_case_id,'name',g.name,'provider',g.provider,'modelId',g.model_id,'purpose',g.purpose,'riskClass',g.risk_class,
  'dataCategories',g.data_categories,'retentionPolicy',g.retention_policy,'inferencePlatform',g.inference_platform,'trainingUse',g.training_use,
  'processingScope',g.processing_scope,'crossBorderTransfer',g.cross_border_transfer,'subprocessors',g.subprocessors,
  'transferSafeguard',g.transfer_safeguard,'evidenceUrls',g.provider_evidence_urls,'lastReviewedAt',g.last_reviewed_at,'nextReviewAt',g.next_review_at
 ) order by g.name),'[]'::jsonb) into v_ai
 from public.brain_ai_governance_registry g
 where g.lifecycle_status in ('ACTIVE','APPROVED')
 and (g.tenant_id=v_tenant or (g.tenant_id='canonical' and (v_tenant='canonical' or g.use_case_id in ('netlify-document-extractor','netlify-koppelingen-ai','netlify-vraagbalk'))));

 select count(*) into v_global_count from public.brain_ai_governance_registry g
 where g.lifecycle_status in ('ACTIVE','APPROVED')
 and (g.tenant_id=v_tenant or (g.tenant_id='canonical' and (v_tenant='canonical' or g.use_case_id in ('netlify-document-extractor','netlify-koppelingen-ai','netlify-vraagbalk'))))
 and (coalesce(g.processing_scope,'UNKNOWN') not like 'EU%' or coalesce(g.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY'));

 if v_policy.mode in ('EU_STORAGE','EU_ONLY') then
  select coalesce(jsonb_agg(x),'[]'::jsonb) into v_violations from (
   select jsonb_build_object('kind','provider','key',r.provider_key,'name',r.display_name,
    'reason',case when r.evidence_status<>'VERIFIED' then 'EU-residency is nog niet runtime/evidence-backed geverifieerd.'
      when r.runtime_status<>'ACTIVE' then 'Providerroute is niet runtime-actief.'
      when v_policy.mode='EU_STORAGE' then 'Opslag is niet aantoonbaar EU-only.'
      else 'Opslag/verwerking/doorgifte is niet aantoonbaar EU-only.' end,
    'storageScope',r.storage_scope,'processingScope',r.processing_scope,'crossBorderTransfer',r.cross_border_transfer,'evidenceStatus',r.evidence_status,'runtimeStatus',r.runtime_status) x
   from public.data_sovereignty_provider_registry_v1 r
   where r.customer_visible=true and r.customer_data_exposure='YES'
    and (r.evidence_status<>'VERIFIED' or r.runtime_status<>'ACTIVE' or coalesce(r.storage_scope,'UNKNOWN') not like 'EU%'
     or (v_policy.mode='EU_ONLY' and (coalesce(r.processing_scope,'UNKNOWN') not like 'EU%'
      or coalesce(r.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY','NO_BY_DESIGN','PRIMARY_PORTAL_PATH_EU','CUSTOMER_PATH_EU_WHEN_PINNED'))))
   union all
   select jsonb_build_object('kind','ai_route','key',g.use_case_id,'name',g.name,'reason','AI-route is niet aantoonbaar EU-only.',
    'provider',g.provider,'modelId',g.model_id,'processingScope',coalesce(g.processing_scope,'UNKNOWN'),'crossBorderTransfer',coalesce(g.cross_border_transfer,'UNKNOWN'),'trainingUse',g.training_use) x
   from public.brain_ai_governance_registry g
   where v_policy.mode='EU_ONLY' and g.lifecycle_status in ('ACTIVE','APPROVED')
    and (g.tenant_id=v_tenant or (g.tenant_id='canonical' and (v_tenant='canonical' or g.use_case_id in ('netlify-document-extractor','netlify-koppelingen-ai','netlify-vraagbalk'))))
    and (coalesce(g.processing_scope,'UNKNOWN') not like 'EU%' or coalesce(g.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY'))
   union all
   select jsonb_build_object('kind','connector','key',c.id::text,'name',c.naam,'reason','Actieve koppeling heeft geen volledig geverifieerde EU-residency voor bron en doel.',
    'sourceType',coalesce(c.configuratie#>>'{source,type}','UNKNOWN'),'targetType',coalesce(c.configuratie#>>'{target,type}','UNKNOWN'),
    'sourceEvidenceStatus',coalesce(sr.evidence_status,'UNKNOWN'),'targetEvidenceStatus',coalesce(tr.evidence_status,'UNKNOWN')) x
   from public.connector_definitions c
   left join public.data_sovereignty_adapter_registry_v1 sr on sr.adapter_id=coalesce(c.configuratie#>>'{source,type}','')
   left join public.data_sovereignty_adapter_registry_v1 tr on tr.adapter_id=coalesce(c.configuratie#>>'{target,type}','')
   where c.organisatie_id::text=v_tenant and lower(c.status) in ('active','enabled','ready','live','approved')
    and (sr.adapter_id is null or tr.adapter_id is null or sr.evidence_status<>'VERIFIED' or tr.evidence_status<>'VERIFIED'
     or (v_policy.mode='EU_ONLY' and (coalesce(sr.processing_scope,'UNKNOWN') not like 'EU%' or coalesce(tr.processing_scope,'UNKNOWN') not like 'EU%'
      or coalesce(sr.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY','NO_BY_DESIGN')
      or coalesce(tr.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY','NO_BY_DESIGN')))
     or (v_policy.mode='EU_STORAGE' and (coalesce(sr.storage_scope,'UNKNOWN') not like 'EU%' or coalesce(tr.storage_scope,'UNKNOWN') not like 'EU%')))
  ) q;
  if v_policy.preferred_ai_provider is not null then
   v_violations:=v_violations||coalesce((select jsonb_agg(jsonb_build_object('kind','policy','key','preferred_ai_provider','name',v_policy.preferred_ai_provider,
    'reason','Geselecteerde AI-provider is nog niet runtime-actief en kan daarom niet veilig worden ingeschakeld.'))
    from public.data_sovereignty_provider_registry_v1 r where r.provider_key=v_policy.preferred_ai_provider and r.runtime_status<>'ACTIVE'),'[]'::jsonb);
  end if;
 end if;

 v_summary:=jsonb_build_object('mode',v_policy.mode,'enforcementMode',v_policy.enforcement_mode,'policySatisfied',jsonb_array_length(v_violations)=0,
  'violationCount',jsonb_array_length(v_violations),'activeAiRoutes',jsonb_array_length(v_ai),'globalOrUnknownAiRoutes',v_global_count,
  'providerCount',jsonb_array_length(v_providers),'flowCount',jsonb_array_length(v_flows),'connectorCount',jsonb_array_length(v_connectors),
  'truthPolicy','measured_or_evidence_backed_else_unknown');

 insert into public.data_sovereignty_snapshot_v1(tenant_id,policy,provider_inventory,ai_routes,data_flows,connectors,summary,violations,generated_at)
 values(v_tenant,to_jsonb(v_policy),v_providers,v_ai,v_flows,v_connectors,v_summary,v_violations,now())
 on conflict (tenant_id) do update set policy=excluded.policy,provider_inventory=excluded.provider_inventory,ai_routes=excluded.ai_routes,
  data_flows=excluded.data_flows,connectors=excluded.connectors,summary=excluded.summary,violations=excluded.violations,generated_at=excluded.generated_at;

 select jsonb_build_object('tenantId',tenant_id,'policy',policy,'providers',provider_inventory,'aiRoutes',ai_routes,'dataFlows',data_flows,
  'connectors',connectors,'summary',summary,'violations',violations,'generatedAt',generated_at)
 into v_result from public.data_sovereignty_snapshot_v1 where tenant_id=v_tenant;
 return v_result;
end $$;
revoke all on function public.refresh_data_sovereignty_snapshot_v1(text) from public,anon,authenticated;
grant execute on function public.refresh_data_sovereignty_snapshot_v1(text) to service_role;

select public.refresh_data_sovereignty_snapshot_v1('canonical');
