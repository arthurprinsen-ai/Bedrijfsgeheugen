create table if not exists public.data_sovereignty_provider_registry_v1 (
  provider_key text primary key,
  display_name text not null,
  service_kind text not null,
  customer_data_exposure text not null check (customer_data_exposure in ('YES','CONDITIONAL','NONE_BY_DEFAULT')),
  storage_scope text not null,
  processing_scope text not null,
  primary_region text,
  cross_border_transfer text not null,
  training_use text not null,
  retention_summary text,
  subprocessors text[] not null default '{}',
  evidence_urls text[] not null default '{}',
  evidence_status text not null default 'UNKNOWN' check (evidence_status in ('VERIFIED','PARTIAL','UNKNOWN','STALE')),
  evidence_checked_at timestamptz,
  runtime_status text not null default 'ACTIVE' check (runtime_status in ('ACTIVE','AVAILABLE_NOT_CONFIGURED','INACTIVE')),
  customer_visible boolean not null default true,
  notes text,
  updated_at timestamptz not null default now()
);
alter table public.data_sovereignty_provider_registry_v1 enable row level security;
revoke all on public.data_sovereignty_provider_registry_v1 from public, anon, authenticated;
grant select,insert,update,delete on public.data_sovereignty_provider_registry_v1 to service_role;

create table if not exists public.tenant_data_sovereignty_policy_v1 (
  tenant_id text primary key,
  mode text not null default 'TRANSPARENT_GLOBAL' check (mode in ('TRANSPARENT_GLOBAL','EU_STORAGE','EU_ONLY','CUSTOM')),
  preferred_ai_provider text,
  preferred_ai_region text,
  allow_cross_border boolean not null default true,
  block_unknown_region boolean not null default false,
  enforcement_mode text not null default 'OBSERVE' check (enforcement_mode in ('OBSERVE','BLOCK')),
  policy_version integer not null default 1 check (policy_version >= 1),
  updated_by text not null default 'system',
  updated_at timestamptz not null default now()
);
alter table public.tenant_data_sovereignty_policy_v1 enable row level security;
revoke all on public.tenant_data_sovereignty_policy_v1 from public, anon, authenticated;
grant select,insert,update,delete on public.tenant_data_sovereignty_policy_v1 to service_role;

create table if not exists public.data_sovereignty_snapshot_v1 (
  tenant_id text primary key,
  policy jsonb not null default '{}'::jsonb,
  provider_inventory jsonb not null default '[]'::jsonb,
  ai_routes jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  violations jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);
alter table public.data_sovereignty_snapshot_v1 enable row level security;
revoke all on public.data_sovereignty_snapshot_v1 from public, anon, authenticated;
grant select,insert,update,delete on public.data_sovereignty_snapshot_v1 to service_role;

insert into public.data_sovereignty_provider_registry_v1
(provider_key,display_name,service_kind,customer_data_exposure,storage_scope,processing_scope,primary_region,cross_border_transfer,training_use,retention_summary,subprocessors,evidence_urls,evidence_status,evidence_checked_at,runtime_status,notes,updated_at)
values
('supabase','Supabase','database_auth_storage','YES','EU_FRANKFURT','EU_FRANKFURT_PINNED','eu-central-1','PRIMARY_PORTAL_PATH_EU','NO_TRAINING','Database, Auth en Storage volgen de gekozen projectregio; externe exports en subprocessors blijven apart te beoordelen.',array['Amazon Web Services'],array['https://supabase.com/docs/guides/security/gdpr-compliance','https://supabase.com/docs/guides/platform/regions','https://supabase.com/docs/guides/functions/regional-invocation'],'VERIFIED',now(),'ACTIVE','Productieproject staat in eu-central-1; portal Edge-aanroepen worden door de applicatielaag naar eu-central-1 gepind.',now()),
('netlify','Netlify','web_hosting_functions_blobs','YES','EU_FRANKFURT_FOR_PORTAL_BLOBS','EU_FRANKFURT_FOR_CUSTOMER_FUNCTIONS','fra / eu-central-1 blobs','CUSTOMER_PATH_EU_WHEN_PINNED','NO_TRAINING','Function requests zijn transit; portal fallback blobs worden expliciet in Frankfurt geopend.',array['Amazon Web Services'],array['https://docs.netlify.com/build/functions/configuration/','https://docs.netlify.com/build/data-and-storage/netlify-blobs/'],'PARTIAL',now(),'ACTIVE','Alle klantgevoelige Netlify Functions moeten expliciet region=fra hebben; site-wide Blob stores moeten expliciet region=eu-central-1 openen.',now()),
('github','GitHub','source_control_ci','NONE_BY_DEFAULT','US_DEFAULT_GITHUB_COM','US_DEFAULT_GITHUB_COM',null,'POSSIBLE_OUTSIDE_EEA','NO_TRAINING','Broncode, CI-metadata en release-evidence; geen klant-runtime-invoer als standaard datastroom.',array[]::text[],array['https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency'],'PARTIAL',now(),'ACTIVE','Publieke github.com repository; EU data residency vereist een daarvoor geschikte GitHub Enterprise Cloud setup. Runtime klantdata hoort hier niet terecht te komen.',now()),
('notion','Notion','knowledge_workspace','CONDITIONAL','WORKSPACE_DEPENDENT','WORKSPACE_DEPENDENT',null,'DEPENDS_ON_WORKSPACE_AND_INTEGRATION','NO_TRAINING_BY_BEDRIJFSGEHEUGEN','Alleen wanneer een Notion-koppeling of interne sync de gegevens daadwerkelijk ontvangt.',array[]::text[],array['https://www.notion.com/help/data-residency'],'PARTIAL',now(),'ACTIVE','EU data residency is workspace/plan/migratie-afhankelijk; daadwerkelijke workspace-regio moet als evidence worden bevestigd.',now()),
('anthropic','Anthropic','ai_inference','YES','PROVIDER_CONTRACT','GLOBAL','global','POSSIBLE_OUTSIDE_EEA','NO','API-invoer wordt request-scoped gebruikt volgens de Bedrijfsgeheugen AI-governance; providerretentie blijft contract/evidence-gebonden.',array['Anthropic'],array[]::text[],'PARTIAL',now(),'ACTIVE','Huidige klantgerichte AI-routes gebruiken Anthropic API en zijn niet als EU-only bewezen; EU_ONLY moet deze routes daarom blokkeren totdat een EU-only route aantoonbaar actief is.',now()),
('openai_eu','OpenAI EU','ai_inference','NONE_BY_DEFAULT','EU_CONFIGURABLE','EU_CONFIGURABLE','Europe','CONFIGURATION_DEPENDENT','NO_API_TRAINING_WHEN_ELIGIBLE_CONFIGURED','Niet de huidige productieroute; alleen beschikbaar zodra een geschikte EU-resident project/modelconfiguratie en contractevidence is gekoppeld.',array[]::text[],array['https://platform.openai.com/docs/guides/your-data#data-residency'],'PARTIAL',now(),'AVAILABLE_NOT_CONFIGURED','Kandidaat voor een selecteerbare EU AI-route; policy mag dit niet als actief beschouwen zolang runtime_status niet ACTIVE is.',now()),
('composio_groq','Composio / Groq','integration_ai_fallback','CONDITIONAL','GLOBAL_OR_PROVIDER_DEPENDENT','GLOBAL_OR_PROVIDER_DEPENDENT','global','POSSIBLE_OUTSIDE_EEA','UNKNOWN','Alleen voor routes die deze fallback daadwerkelijk gebruiken.',array['Composio','Groq'],array[]::text[],'PARTIAL',now(),'ACTIVE','Aanwezig als AI fallback in het governance-register; EU_ONLY behandelt deze route als niet toegestaan tenzij regio-evidence verandert.',now())
on conflict (provider_key) do update set
 display_name=excluded.display_name,service_kind=excluded.service_kind,customer_data_exposure=excluded.customer_data_exposure,
 storage_scope=excluded.storage_scope,processing_scope=excluded.processing_scope,primary_region=excluded.primary_region,
 cross_border_transfer=excluded.cross_border_transfer,training_use=excluded.training_use,retention_summary=excluded.retention_summary,
 subprocessors=excluded.subprocessors,evidence_urls=excluded.evidence_urls,evidence_status=excluded.evidence_status,
 evidence_checked_at=excluded.evidence_checked_at,runtime_status=excluded.runtime_status,notes=excluded.notes,updated_at=now();

insert into public.tenant_data_sovereignty_policy_v1
(tenant_id,mode,allow_cross_border,block_unknown_region,enforcement_mode,updated_by)
values ('canonical','TRANSPARENT_GLOBAL',true,false,'OBSERVE','migration')
on conflict (tenant_id) do nothing;

update public.brain_ai_governance_registry
set processing_scope=coalesce(processing_scope,'GLOBAL'),
    cross_border_transfer=coalesce(cross_border_transfer,'POSSIBLE_OUTSIDE_EEA'),
    subprocessors=case when coalesce(array_length(subprocessors,1),0)=0 and provider='Anthropic' then array['Anthropic']::text[] else subprocessors end,
    updated_at=now()
where tenant_id='canonical'
  and use_case_id in ('netlify-document-extractor','netlify-koppelingen-ai','netlify-vraagbalk')
  and lifecycle_status in ('ACTIVE','APPROVED');

create or replace function public.refresh_data_sovereignty_snapshot_v1(p_tenant_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare
  v_tenant text:=nullif(trim(p_tenant_id),'');
  v_policy public.tenant_data_sovereignty_policy_v1%rowtype;
  v_providers jsonb:='[]'::jsonb; v_ai jsonb:='[]'::jsonb; v_violations jsonb:='[]'::jsonb; v_summary jsonb:='{}'::jsonb; v_result jsonb;
  v_global_count integer:=0;
begin
  if v_tenant is null then raise exception 'tenant_id is required'; end if;
  insert into public.tenant_data_sovereignty_policy_v1(tenant_id,updated_by) values(v_tenant,'automatic-default') on conflict (tenant_id) do nothing;
  select * into v_policy from public.tenant_data_sovereignty_policy_v1 where tenant_id=v_tenant;

  select coalesce(jsonb_agg(jsonb_build_object(
    'providerKey',r.provider_key,'name',r.display_name,'serviceKind',r.service_kind,'customerDataExposure',r.customer_data_exposure,
    'storageScope',r.storage_scope,'processingScope',r.processing_scope,'primaryRegion',r.primary_region,'crossBorderTransfer',r.cross_border_transfer,
    'trainingUse',r.training_use,'retention',r.retention_summary,'subprocessors',r.subprocessors,'evidenceUrls',r.evidence_urls,
    'evidenceStatus',r.evidence_status,'evidenceCheckedAt',r.evidence_checked_at,'runtimeStatus',r.runtime_status,'notes',r.notes
  ) order by r.display_name),'[]'::jsonb) into v_providers
  from public.data_sovereignty_provider_registry_v1 r where r.customer_visible=true;

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
        'reason',case when v_policy.mode='EU_STORAGE' then 'Opslag is niet aantoonbaar EU-only.' else 'Opslag/verwerking/doorgifte is niet aantoonbaar EU-only.' end,
        'storageScope',r.storage_scope,'processingScope',r.processing_scope,'crossBorderTransfer',r.cross_border_transfer,'runtimeStatus',r.runtime_status) x
      from public.data_sovereignty_provider_registry_v1 r
      where r.customer_visible=true and r.customer_data_exposure='YES'
        and (coalesce(r.storage_scope,'UNKNOWN') not like 'EU%' or (v_policy.mode='EU_ONLY' and (
          coalesce(r.processing_scope,'UNKNOWN') not like 'EU%' or coalesce(r.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY','PRIMARY_PORTAL_PATH_EU','CUSTOMER_PATH_EU_WHEN_PINNED'))))
      union all
      select jsonb_build_object('kind','ai_route','key',g.use_case_id,'name',g.name,'reason','AI-route is niet aantoonbaar EU-only.',
        'provider',g.provider,'modelId',g.model_id,'processingScope',coalesce(g.processing_scope,'UNKNOWN'),
        'crossBorderTransfer',coalesce(g.cross_border_transfer,'UNKNOWN'),'trainingUse',g.training_use) x
      from public.brain_ai_governance_registry g
      where v_policy.mode='EU_ONLY' and g.lifecycle_status in ('ACTIVE','APPROVED')
        and (g.tenant_id=v_tenant or (g.tenant_id='canonical' and (v_tenant='canonical' or g.use_case_id in ('netlify-document-extractor','netlify-koppelingen-ai','netlify-vraagbalk'))))
        and (coalesce(g.processing_scope,'UNKNOWN') not like 'EU%' or coalesce(g.cross_border_transfer,'UNKNOWN') not in ('NO','NONE','EEA_ONLY','EU_ONLY'))
    ) q;
    if v_policy.preferred_ai_provider is not null then
      v_violations:=v_violations||coalesce((select jsonb_agg(jsonb_build_object('kind','policy','key','preferred_ai_provider','name',v_policy.preferred_ai_provider,
        'reason','Geselecteerde AI-provider is nog niet runtime-actief en kan daarom niet veilig worden ingeschakeld.'))
        from public.data_sovereignty_provider_registry_v1 r where r.provider_key=v_policy.preferred_ai_provider and r.runtime_status<>'ACTIVE'),'[]'::jsonb);
    end if;
  end if;

  v_summary:=jsonb_build_object('mode',v_policy.mode,'enforcementMode',v_policy.enforcement_mode,'policySatisfied',jsonb_array_length(v_violations)=0,
    'violationCount',jsonb_array_length(v_violations),'activeAiRoutes',jsonb_array_length(v_ai),'globalOrUnknownAiRoutes',v_global_count,
    'providerCount',jsonb_array_length(v_providers),'truthPolicy','measured_or_evidence_backed_else_unknown');

  insert into public.data_sovereignty_snapshot_v1(tenant_id,policy,provider_inventory,ai_routes,summary,violations,generated_at)
  values(v_tenant,to_jsonb(v_policy),v_providers,v_ai,v_summary,v_violations,now())
  on conflict (tenant_id) do update set policy=excluded.policy,provider_inventory=excluded.provider_inventory,ai_routes=excluded.ai_routes,
    summary=excluded.summary,violations=excluded.violations,generated_at=excluded.generated_at;

  select jsonb_build_object('tenantId',tenant_id,'policy',policy,'providers',provider_inventory,'aiRoutes',ai_routes,'summary',summary,'violations',violations,'generatedAt',generated_at)
  into v_result from public.data_sovereignty_snapshot_v1 where tenant_id=v_tenant;
  return v_result;
end $$;
revoke all on function public.refresh_data_sovereignty_snapshot_v1(text) from public,anon,authenticated;
grant execute on function public.refresh_data_sovereignty_snapshot_v1(text) to service_role;

create or replace function public.powerhouse_refresh_data_sovereignty_v1()
returns jsonb language plpgsql security definer set search_path='public' as $$
declare r record; v_count integer:=0; v_blocked integer:=0; v_snapshot jsonb;
begin
  for r in select tenant_id from public.tenant_data_sovereignty_policy_v1 union select 'canonical'::text loop
    v_snapshot:=public.refresh_data_sovereignty_snapshot_v1(r.tenant_id); v_count:=v_count+1;
    if coalesce((v_snapshot#>>'{summary,policySatisfied}')::boolean,false)=false then v_blocked:=v_blocked+1; end if;
  end loop;
  return jsonb_build_object('refreshed',v_count,'policyViolations',v_blocked,'refreshedAt',now(),'contract','data-sovereignty-control-plane-v1');
end $$;
revoke all on function public.powerhouse_refresh_data_sovereignty_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_data_sovereignty_v1() to service_role;

select public.refresh_data_sovereignty_snapshot_v1('canonical');
