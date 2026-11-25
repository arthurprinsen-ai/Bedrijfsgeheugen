create table if not exists public.security_framework_registry_v1(
 framework_key text primary key,
 label text not null,
 applicability text not null default 'ASSESS' check(applicability in('APPLICABLE','WHEN_APPLICABLE','ASSESS','VOLUNTARY_REFERENCE')),
 notes text,
 evidence_urls text[] not null default '{}',
 customer_visible boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.security_framework_registry_v1 enable row level security;
revoke all on public.security_framework_registry_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.security_framework_registry_v1 to service_role;

create table if not exists public.security_provider_assurance_v1(
 provider_key text primary key,
 assurance_scope text not null,
 evidence_status text not null default 'PROVIDER_DECLARED' check(evidence_status in('VERIFIED_CONFIG','PROVIDER_DECLARED','PARTIAL','UNKNOWN','STALE')),
 evidence_urls text[] not null default '{}',
 notes text,
 evidence_checked_at timestamptz,
 customer_visible boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.security_provider_assurance_v1 enable row level security;
revoke all on public.security_provider_assurance_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.security_provider_assurance_v1 to service_role;

create table if not exists public.security_management_observation_v1(
 observation_id uuid primary key default gen_random_uuid(),
 tenant_id text not null,
 provider_key text not null,
 control_key text not null,
 status text not null check(status in('VERIFIED','PASS','PARTIAL','WARN','FAIL','UNKNOWN')),
 evidence jsonb not null default '{}'::jsonb,
 source text not null,
 observed_at timestamptz not null default now(),
 expires_at timestamptz,
 observed_by text not null default 'powerhouse-observer'
);
create index if not exists security_management_observation_lookup_v1 on public.security_management_observation_v1(tenant_id,provider_key,control_key,observed_at desc);
alter table public.security_management_observation_v1 enable row level security;
revoke all on public.security_management_observation_v1 from public,anon,authenticated;
grant select,insert on public.security_management_observation_v1 to service_role;

create table if not exists public.security_trust_snapshot_v1(
 tenant_id text primary key,
 database_posture jsonb not null default '{}'::jsonb,
 provider_assurance jsonb not null default '[]'::jsonb,
 management_observations jsonb not null default '[]'::jsonb,
 frameworks jsonb not null default '[]'::jsonb,
 findings jsonb not null default '[]'::jsonb,
 summary jsonb not null default '{}'::jsonb,
 generated_at timestamptz not null default now()
);
alter table public.security_trust_snapshot_v1 enable row level security;
revoke all on public.security_trust_snapshot_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.security_trust_snapshot_v1 to service_role;

insert into public.security_framework_registry_v1(framework_key,label,applicability,notes,evidence_urls) values
('AVG_GDPR','AVG / GDPR','WHEN_APPLICABLE','Persoonsgegevens, verwerkingsgrondslagen, rechten, beveiliging en verwerkers. Een securitycontrol is geen volledige AVG-conformiteitsclaim.',array['https://eur-lex.europa.eu/eli/reg/2016/679/oj']),
('EU_AI_ACT','EU AI Act','WHEN_APPLICABLE','AI-rol en risicoklasse worden per use-case beoordeeld; technische controls en legal applicability blijven gescheiden.',array['https://eur-lex.europa.eu/eli/reg/2024/1689/oj']),
('NIS','NIS (legacy)','VOLUNTARY_REFERENCE','Historische NIS-richtlijn; voor actuele scope en maatregelen geldt NIS2/Cyberbeveiligingswet. Alleen als historische traceability tonen.',array['https://eur-lex.europa.eu/eli/dir/2016/1148/oj']),
('NIS2_CBW','NIS2 / Cyberbeveiligingswet','ASSESS','Formele toepasselijkheid hangt af van entiteit, sector, omvang en aanwijzing. Het Trust Center toont alignment, geen automatische wettelijke scopeclaim.',array['https://eur-lex.europa.eu/eli/dir/2022/2555/oj']),
('ISO27001','ISO/IEC 27001:2022','VOLUNTARY_REFERENCE','ISMS-referentiekader. Alleen een geldig certificaat van Bedrijfsgeheugen zelf mag als eigen certificering worden getoond.',array['https://www.iso.org/standard/27001']),
('ISO27017','ISO/IEC 27017:2026','VOLUNTARY_REFERENCE','Cloud security controls als referentie.',array['https://www.iso.org/standard/27017']),
('ISO27018','ISO/IEC 27018:2025','VOLUNTARY_REFERENCE','Cloud privacy als referentie.',array['https://www.iso.org/standard/27018']),
('ISO22301','ISO 22301:2019','VOLUNTARY_REFERENCE','Business continuity en herstel als referentie.',array['https://www.iso.org/standard/75106.html']),
('ISO42001','ISO/IEC 42001:2023','VOLUNTARY_REFERENCE','AI management system als governance-referentie; niet gelijk aan EU AI Act-conformiteit.',array['https://www.iso.org/standard/42001']),
('SOC2','SOC 2','VOLUNTARY_REFERENCE','Provider assurance en control evidence; provider SOC 2 betekent niet dat Bedrijfsgeheugen zelf SOC 2-geattesteerd is.',array[]::text[]),
('NIST_CSF_2','NIST Cybersecurity Framework 2.0','VOLUNTARY_REFERENCE','Govern, Identify, Protect, Detect, Respond en Recover.',array['https://www.nist.gov/cyberframework']),
('CIS_CONTROLS','CIS Controls','VOLUNTARY_REFERENCE','Prioritering van concrete cybermaatregelen en hardening.',array['https://www.cisecurity.org/controls']),
('OWASP','OWASP ASVS / Top 10','VOLUNTARY_REFERENCE','Applicatie- en API-security referentie voor portal, website en backend.',array['https://owasp.org/']),
('DORA','DORA','WHEN_APPLICABLE','Alleen relevant binnen toepasselijke financiële/ICT-third-party context.',array['https://eur-lex.europa.eu/eli/reg/2022/2554/oj']),
('CRA','Cyber Resilience Act','WHEN_APPLICABLE','Productcybersecurity voor producten met digitale elementen; toepasselijkheid hangt af van productrol en scope.',array['https://eur-lex.europa.eu/eli/reg/2024/2847/oj'])
on conflict(framework_key) do update set label=excluded.label,applicability=excluded.applicability,notes=excluded.notes,evidence_urls=excluded.evidence_urls,updated_at=now();

insert into public.security_provider_assurance_v1(provider_key,assurance_scope,evidence_status,evidence_urls,notes,evidence_checked_at) values
('supabase','Provider security en databaseplatform','PROVIDER_DECLARED',array['https://supabase.com/security'],'Provider-assurance is geen eigen certificering.',now()),
('netlify','Provider security, hosting en deployment','PROVIDER_DECLARED',array['https://www.netlify.com/security/'],'Account- en siteconfiguratie vereist eigen runtimebewijs.',now()),
('github','Provider security en software supply chain','PROVIDER_DECLARED',array['https://github.com/security'],'CI/securityprovider assurance is geen dataresidentiebewijs.',now()),
('notion','Provider security/privacy voor workspace en integraties','PROVIDER_DECLARED',array['https://www.notion.so/help/security-and-privacy'],'Werkspacetoegang en bots vereisen aparte IAM-observatie.',now()),
('openai_eu','Provider trust/security en data controls','PROVIDER_DECLARED',array['https://trust.openai.com/'],'Alleen werkelijk geconfigureerde project/modelsettings tellen als runtimebewijs.',now()),
('anthropic','Provider trust/security voor AI inference','PROVIDER_DECLARED',array['https://trust.anthropic.com/'],'Contract- en route-evidence blijft vereist.',now())
on conflict(provider_key) do update set assurance_scope=excluded.assurance_scope,evidence_status=excluded.evidence_status,evidence_urls=excluded.evidence_urls,notes=excluded.notes,evidence_checked_at=excluded.evidence_checked_at,updated_at=now();

create or replace function public.security_database_posture_v1()
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_anon_sd integer:=0;v_auth_sd integer:=0;v_mutable integer:=0;v_rls_no_policy integer:=0;v_view_definer integer:=0;v_mat_api integer:=0;
begin
 select count(*) into v_anon_sd from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE');
 select count(*) into v_auth_sd from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('authenticated',p.oid,'EXECUTE');
 select count(*) into v_mutable from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') not like '%search_path=%';
 select count(*) into v_rls_no_policy from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in('r','p') and c.relrowsecurity and not exists(select 1 from pg_policy pol where pol.polrelid=c.oid);
 select count(*) into v_view_definer from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and not(coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true']);
 select count(*) into v_mat_api from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='m' and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'));
 return jsonb_build_object('anonSecurityDefinerFunctions',v_anon_sd,'authenticatedSecurityDefinerFunctions',v_auth_sd,'securityDefinerMutableSearchPath',v_mutable,'rlsNoPolicy',v_rls_no_policy,'viewsWithoutSecurityInvoker',v_view_definer,'materializedViewsApiReadable',v_mat_api,'highRiskCount',v_anon_sd+v_view_definer+v_mat_api,'observedAt',now(),'truthPolicy','database_catalog_observed');
end $$;
revoke all on function public.security_database_posture_v1() from public,anon,authenticated;
grant execute on function public.security_database_posture_v1() to service_role;

create or replace function public.refresh_security_trust_snapshot_v1(p_tenant_id text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_tenant text:=nullif(trim(p_tenant_id),'');v_db jsonb;v_assurance jsonb:='[]'::jsonb;v_obs jsonb:='[]'::jsonb;v_frameworks jsonb:='[]'::jsonb;v_findings jsonb:='[]'::jsonb;v_summary jsonb;v_result jsonb;v_high integer:=0;v_total integer:=0;v_current integer:=0;
begin
 if v_tenant is null then raise exception 'tenant_id is required'; end if;
 v_db:=public.security_database_posture_v1();
 select coalesce(jsonb_agg(jsonb_build_object('providerKey',provider_key,'assuranceScope',assurance_scope,'evidenceStatus',evidence_status,'evidenceUrls',evidence_urls,'notes',notes,'evidenceCheckedAt',evidence_checked_at) order by provider_key),'[]'::jsonb) into v_assurance from public.security_provider_assurance_v1 where customer_visible=true;
 select coalesce(jsonb_agg(jsonb_build_object('frameworkKey',framework_key,'label',label,'applicability',applicability,'notes',notes,'evidenceUrls',evidence_urls) order by label),'[]'::jsonb) into v_frameworks from public.security_framework_registry_v1 where customer_visible=true;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.provider_key,x.control_key),'[]'::jsonb) into v_obs from(
  select distinct on(provider_key,control_key) provider_key,control_key,case when expires_at is not null and expires_at<now() then 'STALE' else status end status,(evidence<>'{}'::jsonb) as evidence_available,source,observed_at,expires_at,observed_by
  from public.security_management_observation_v1 where tenant_id in(v_tenant,'canonical') order by provider_key,control_key,observed_at desc
 )x;
 if coalesce((v_db->>'anonSecurityDefinerFunctions')::int,0)>0 then v_findings:=v_findings||jsonb_build_array(jsonb_build_object('key','DB-ANON-SECURITY-DEFINER','severity','critical','title','Anonieme SECURITY DEFINER RPC exposure','detail',(v_db->>'anonSecurityDefinerFunctions')||' SECURITY DEFINER-functies zijn door anon uitvoerbaar.')); end if;
 if coalesce((v_db->>'viewsWithoutSecurityInvoker')::int,0)>0 then v_findings:=v_findings||jsonb_build_array(jsonb_build_object('key','DB-SECURITY-DEFINER-VIEWS','severity','high','title','Views zonder SECURITY INVOKER','detail',(v_db->>'viewsWithoutSecurityInvoker')||' view(s) draaien niet aantoonbaar als invoker.')); end if;
 if coalesce((v_db->>'materializedViewsApiReadable')::int,0)>0 then v_findings:=v_findings||jsonb_build_array(jsonb_build_object('key','DB-MATERIALIZED-API','severity','high','title','Materialized views via API leesbaar','detail',(v_db->>'materializedViewsApiReadable')||' materialized view(s) zijn leesbaar voor anon/authenticated.')); end if;
 if coalesce((v_db->>'securityDefinerMutableSearchPath')::int,0)>0 then v_findings:=v_findings||jsonb_build_array(jsonb_build_object('key','DB-MUTABLE-SEARCH-PATH','severity','medium','title','Mutable search_path op SECURITY DEFINER','detail',(v_db->>'securityDefinerMutableSearchPath')||' functie(s) missen een vaste search_path.')); end if;
 if coalesce((v_db->>'rlsNoPolicy')::int,0)>0 then v_findings:=v_findings||jsonb_build_array(jsonb_build_object('key','DB-RLS-NO-POLICY','severity','info','title','RLS aan zonder policy','detail',(v_db->>'rlsNoPolicy')||' tabel(len) hebben RLS aan zonder policy; deny-all kan bewust zijn en vereist classificatie.')); end if;
 select count(*) into v_total from jsonb_array_elements(v_assurance);
 select count(*) into v_current from jsonb_array_elements(v_obs) o where o->>'status' in('VERIFIED','PASS');
 select count(*) into v_high from jsonb_array_elements(v_findings) f where f->>'severity' in('critical','high');
 v_summary:=jsonb_build_object('postureStatus',case when v_high>0 then 'ACTION_REQUIRED' when jsonb_array_length(v_findings)>0 then 'EVIDENCE_PARTIAL' else 'OBSERVED_NO_HIGH_FINDINGS' end,'findingCount',jsonb_array_length(v_findings),'highRiskFindingCount',v_high,'providerAssuranceCount',v_total,'currentManagementEvidence',v_current,'evidenceCoverage',least(100,round((coalesce(v_current,0)+case when v_high=0 then 4 else 1 end)::numeric/greatest(1,v_total+6)*100)),'truthPolicy','measured_or_evidence_backed_else_unknown','providerAssuranceIsOwnCertification',false);
 insert into public.security_trust_snapshot_v1(tenant_id,database_posture,provider_assurance,management_observations,frameworks,findings,summary,generated_at) values(v_tenant,v_db,v_assurance,v_obs,v_frameworks,v_findings,v_summary,now())
 on conflict(tenant_id) do update set database_posture=excluded.database_posture,provider_assurance=excluded.provider_assurance,management_observations=excluded.management_observations,frameworks=excluded.frameworks,findings=excluded.findings,summary=excluded.summary,generated_at=excluded.generated_at;
 select jsonb_build_object('tenantId',tenant_id,'database',database_posture,'providerAssurance',provider_assurance,'managementObservations',management_observations,'frameworks',frameworks,'findings',findings,'summary',summary,'generatedAt',generated_at) into v_result from public.security_trust_snapshot_v1 where tenant_id=v_tenant;
 return v_result;
end $$;
revoke all on function public.refresh_security_trust_snapshot_v1(text) from public,anon,authenticated;
grant execute on function public.refresh_security_trust_snapshot_v1(text) to service_role;

create or replace function public.record_security_management_observation_v1(p_tenant_id text,p_provider_key text,p_control_key text,p_status text,p_evidence jsonb,p_source text,p_expires_at timestamptz,p_observed_by text)
returns jsonb language plpgsql security definer set search_path='public' as $$
declare v_id uuid;
begin
 if nullif(trim(p_tenant_id),'') is null or nullif(trim(p_provider_key),'') is null or nullif(trim(p_control_key),'') is null then raise exception 'observation identity is required'; end if;
 if upper(coalesce(p_status,'')) not in('VERIFIED','PASS','PARTIAL','WARN','FAIL','UNKNOWN') then raise exception 'invalid status'; end if;
 insert into public.security_management_observation_v1(tenant_id,provider_key,control_key,status,evidence,source,expires_at,observed_by) values(trim(p_tenant_id),trim(p_provider_key),trim(p_control_key),upper(p_status),coalesce(p_evidence,'{}'::jsonb),coalesce(nullif(trim(p_source),''),'runtime'),p_expires_at,coalesce(nullif(trim(p_observed_by),''),'powerhouse-observer')) returning observation_id into v_id;
 return jsonb_build_object('observationId',v_id,'readback',public.refresh_security_trust_snapshot_v1(trim(p_tenant_id)));
end $$;
revoke all on function public.record_security_management_observation_v1(text,text,text,text,jsonb,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.record_security_management_observation_v1(text,text,text,text,jsonb,text,timestamptz,text) to service_role;


create or replace function public.refresh_trust_after_connector_change_v1()
returns trigger
language plpgsql
security definer
set search_path='public'
as $$
declare
 v_tenant text;
 v_old_tenant text;
begin
 if tg_op='DELETE' then
  v_tenant:=old.organisatie_id::text;
 else
  v_tenant:=new.organisatie_id::text;
 end if;

 if tg_op='UPDATE' and old.organisatie_id is distinct from new.organisatie_id then
  v_old_tenant:=old.organisatie_id::text;
  perform public.refresh_data_sovereignty_snapshot_v1(v_old_tenant);
  perform public.refresh_security_trust_snapshot_v1(v_old_tenant);
 end if;

 perform public.refresh_data_sovereignty_snapshot_v1(v_tenant);
 perform public.refresh_security_trust_snapshot_v1(v_tenant);

 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.refresh_trust_after_connector_change_v1() from public,anon,authenticated;
grant execute on function public.refresh_trust_after_connector_change_v1() to service_role;

drop trigger if exists connector_definitions_trust_refresh_v1 on public.connector_definitions;
create trigger connector_definitions_trust_refresh_v1
after insert or update or delete on public.connector_definitions
for each row execute function public.refresh_trust_after_connector_change_v1();

create or replace function public.powerhouse_refresh_data_sovereignty_v1()
returns jsonb language plpgsql security definer set search_path='public' as $$
declare r record;v_count integer:=0;v_blocked integer:=0;v_snapshot jsonb;v_security jsonb;v_security_findings integer:=0;
begin
 for r in select tenant_id from public.tenant_data_sovereignty_policy_v1 union select 'canonical'::text loop
  v_snapshot:=public.refresh_data_sovereignty_snapshot_v1(r.tenant_id);
  v_security:=public.refresh_security_trust_snapshot_v1(r.tenant_id);
  v_count:=v_count+1;
  if coalesce((v_snapshot#>>'{summary,policySatisfied}')::boolean,false)=false then v_blocked:=v_blocked+1;end if;
  v_security_findings:=v_security_findings+coalesce((v_security#>>'{summary,findingCount}')::int,0);
 end loop;
 return jsonb_build_object('refreshed',v_count,'policyViolations',v_blocked,'securityFindings',v_security_findings,'refreshedAt',now(),'contract','data-sovereignty-security-trust-control-plane-v1');
end $$;
revoke all on function public.powerhouse_refresh_data_sovereignty_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_data_sovereignty_v1() to service_role;

select public.refresh_security_trust_snapshot_v1('canonical');