begin;

alter table public.powerhouse_compliance_evidence_v1
  add column if not exists tenant_id text;

update public.powerhouse_compliance_evidence_v1
set tenant_id = coalesce(nullif(tenant_id,''), 'canonical')
where tenant_id is null or tenant_id='';

alter table public.powerhouse_compliance_evidence_v1
  alter column tenant_id set default 'canonical',
  alter column tenant_id set not null;

create index if not exists powerhouse_compliance_evidence_v1_tenant_framework_idx
  on public.powerhouse_compliance_evidence_v1 (tenant_id, control_key, observed_at desc);

alter table public.powerhouse_optimization_candidate_v1
  add column if not exists tenant_id text;

create index if not exists powerhouse_optimization_candidate_v1_tenant_status_idx
  on public.powerhouse_optimization_candidate_v1 (tenant_id, status, safety_class, confidence desc, created_at);

create table if not exists public.powerhouse_compliance_control_catalog_v1 (
  control_key text primary key,
  framework text not null check (framework in ('EU_AI_ACT','NIS2','CSRD_ESRS')),
  category text not null,
  title text not null,
  description text not null,
  applicability_status text not null default 'assessment_required' check (applicability_status in ('assessment_required','generally_applicable','conditional')),
  legal_reference text,
  effective_from date,
  source_url text not null,
  source_published_at date,
  source_checked_at timestamptz not null default now(),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.powerhouse_compliance_control_catalog_v1 enable row level security;
alter table public.powerhouse_compliance_control_catalog_v1 force row level security;
revoke all on public.powerhouse_compliance_control_catalog_v1 from public, anon, authenticated;
grant select on public.powerhouse_compliance_control_catalog_v1 to service_role;

insert into public.powerhouse_compliance_control_catalog_v1
(control_key,framework,category,title,description,applicability_status,legal_reference,effective_from,source_url,source_published_at,metadata)
values
('eu-ai-act.inventory-role-risk','EU_AI_ACT','governance','AI-systemen, rol en risicoclassificatie','Houd een aantoonbaar register bij van AI-systemen en bepaal per use-case de rol, het doel en de toepasselijke risicocategorie.','assessment_required','AI Act risk-based framework',null,'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.article-50-transparency','EU_AI_ACT','transparency','Artikel 50 transparantie','Borg aantoonbaar wanneer gebruikers moeten weten dat zij met AI interageren of AI-gegenereerde of gemanipuleerde inhoud zien.','conditional','AI Act Article 50','2026-08-02','https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems','2026-07-20','{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.risk-management','EU_AI_ACT','high-risk','Risicobeheer','Voor mogelijk hoog-risico AI: bewijs risicobeoordeling en mitigerende maatregelen; toepasselijkheid moet eerst worden vastgesteld.','conditional','High-risk AI obligations','2027-12-02','https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.data-governance','EU_AI_ACT','high-risk','Data governance en kwaliteit','Voor toepasselijke hoog-risico systemen: bewijs relevante data governance en kwaliteit.','conditional','High-risk AI obligations','2027-12-02','https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.logging-documentation','EU_AI_ACT','high-risk','Logging, traceerbaarheid en documentatie','Voor toepasselijke hoog-risico systemen: bewijs logging, traceerbaarheid en technische documentatie.','conditional','High-risk AI obligations','2027-12-02','https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.human-oversight','EU_AI_ACT','high-risk','Menselijk toezicht','Voor toepasselijke hoog-risico systemen: bewijs passend menselijk toezicht en operationele monitoring.','conditional','High-risk AI obligations','2027-12-02','https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.robustness-cybersecurity','EU_AI_ACT','high-risk','Nauwkeurigheid, robuustheid en cyberbeveiliging','Voor toepasselijke hoog-risico systemen: bewijs passende nauwkeurigheid, robuustheid en cyberbeveiliging.','conditional','High-risk AI obligations','2027-12-02','https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('eu-ai-act.monitoring-incidents','EU_AI_ACT','lifecycle','Monitoring en incidenten','Leg monitoring, afwijkingen, incidenten en corrigerende acties aantoonbaar vast voor AI-systemen waarop deze verplichtingen van toepassing zijn.','conditional','AI Act lifecycle obligations',null,'https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),

('nis2.applicability','NIS2','scope','NIS2 toepasselijkheid','Bepaal en documenteer of de organisatie als essentiële of belangrijke entiteit of anderszins binnen de toepasselijke nationale NIS2-implementatie valt.','assessment_required','Directive (EU) 2022/2555',null,'https://digital-strategy.ec.europa.eu/en/policies/nis2-directive',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.risk-management','NIS2','risk','Cybersecurity-risicobeheer','Bewijs een passend cybersecurity-risicobeheer inclusief beleid, maatregelen, ownership en periodieke toetsing.','conditional','NIS2 cybersecurity risk-management measures',null,'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.incident-handling-reporting','NIS2','incident','Incidentafhandeling en meldpad','Bewijs incidentafhandeling en een meldpad dat toepasselijke 24-uurs, 72-uurs en eindrapportageverplichtingen kan ondersteunen.','conditional','NIS2 incident reporting',null,'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.business-continuity','NIS2','resilience','Business continuity en herstel','Bewijs continuïteit, backup, disaster recovery, crisismanagement en hersteltests.','conditional','NIS2 cybersecurity risk-management measures',null,'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.supply-chain','NIS2','supply-chain','Supply-chain security','Bewijs beoordeling en beheersing van cybersecurityrisico’s bij leveranciers en digitale ketenpartners.','conditional','NIS2 supply-chain security',null,'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.vulnerability','NIS2','security','Kwetsbaarheden','Bewijs vulnerability handling, disclosure, patching en opvolging.','conditional','NIS2 vulnerability handling and disclosure',null,'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.crypto-access','NIS2','security','Cryptografie, toegang en MFA','Bewijs passend gebruik van cryptografie/encryptie, toegangsbeheer en sterke authenticatie waar toepasselijk.','conditional','NIS2 cybersecurity risk-management measures',null,'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('nis2.management-accountability','NIS2','governance','Bestuurlijke verantwoordelijkheid','Bewijs governance, management ownership en toezicht op cybersecurity-risicobeheer.','conditional','NIS2 management accountability',null,'https://digital-strategy.ec.europa.eu/en/policies/nis2-directive',null,'{"evidence_first":true,"legal_conclusion":false}'::jsonb),

('csrd-esrs.applicability-materiality','CSRD_ESRS','scope','Toepasselijkheid en materialiteit','Bepaal reporting scope, materialiteit en welke ESRS-informatie aantoonbaar relevant is; buiten scope kan een vrijwillige standaard passender zijn.','assessment_required','CSRD / revised ESRS 2026',null,'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','2026-07-03','{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('csrd-esrs.reporting-boundary','CSRD_ESRS','governance','Rapportagegrens en waardeketen','Bewijs welke entiteiten, activiteiten en relevante waardeketeninformatie binnen de duurzaamheidsrapportage vallen.','conditional','Revised ESRS 2026',null,'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','2026-07-03','{"evidence_first":true,"legal_conclusion":false}'::jsonb),
('csrd-esrs.climate-energy','CSRD_ESRS','environment','Klimaat en energie','Borg traceerbare energie- en klimaatdata met bron, methode, periode, eenheid en confidence; ontbrekende fysieke data blijft onbekend en wordt niet naar nul vertaald.','conditional','Revised ESRS environmental disclosures',null,'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','2026-07-03','{"evidence_first":true,"legal_conclusion":false,"null_not_zero":true}'::jsonb),
('csrd-esrs.water','CSRD_ESRS','environment','Water','Borg traceerbare waterdata waar materieel en beschikbaar, inclusief methode en onzekerheid.','conditional','Revised ESRS environmental disclosures',null,'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','2026-07-03','{"evidence_first":true,"legal_conclusion":false,"null_not_zero":true}'::jsonb),
('csrd-esrs.data-quality','CSRD_ESRS','evidence','Datakwaliteit en herleidbaarheid','Borg lineage, provenance, freshness, confidence, bewijs en reproduceerbare berekening voor gerapporteerde duurzaamheidsinformatie.','conditional','Revised ESRS 2026',null,'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','2026-07-03','{"evidence_first":true,"legal_conclusion":false}'::jsonb)
on conflict (control_key) do update set
  framework=excluded.framework,
  category=excluded.category,
  title=excluded.title,
  description=excluded.description,
  applicability_status=excluded.applicability_status,
  legal_reference=excluded.legal_reference,
  effective_from=excluded.effective_from,
  source_url=excluded.source_url,
  source_published_at=excluded.source_published_at,
  source_checked_at=now(),
  active=true,
  metadata=excluded.metadata;

create or replace view public.powerhouse_resource_tenant_summary_v1
with (security_invoker = true)
as
select
  tenant_id,
  min(day) as first_observed_day,
  max(day) as latest_observed_day,
  sum(usage_events)::bigint as usage_events,
  sum(resource_amount) as resource_amount,
  sum(factor_observations)::bigint as factor_observations,
  case when sum(usage_events)>0 then sum(factor_observations)::numeric/sum(usage_events)::numeric else null end as factor_coverage,
  sum(energy_kwh) filter (where energy_kwh is not null) as energy_kwh,
  sum(co2e_kg) filter (where co2e_kg is not null) as co2e_kg,
  sum(water_liters) filter (where water_liters is not null) as water_liters,
  min(min_factor_confidence) filter (where min_factor_confidence is not null) as min_factor_confidence,
  bool_and(provenance_complete) as provenance_complete,
  count(distinct provider)::integer as providers,
  count(distinct resource_type)::integer as resource_types
from public.powerhouse_resource_intelligence_daily_v1
group by tenant_id;

revoke all on public.powerhouse_resource_tenant_summary_v1 from public, anon, authenticated;
grant select on public.powerhouse_resource_tenant_summary_v1 to service_role;

create or replace function public.powerhouse_generate_resource_optimization_candidates_v1()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
  second_count integer := 0;
begin
  insert into public.powerhouse_optimization_candidate_v1 (
    source_key, tenant_id, component_id, owner_agent, opportunity_type, baseline, expected_impact,
    confidence, safety_class, proposed_action, rollback_plan, status, production_authority,
    learning_fingerprint, notes
  )
  select
    'resource-efficiency:' || t.tenant_id || ':action:' || b.action_id::text,
    t.tenant_id,
    'powerhouse-resource-intelligence-v1',
    'agent-product-opportunity',
    'resource_efficiency',
    jsonb_build_object(
      'action_id', b.action_id,
      'observed_cost_eur', b.observed_cost_eur,
      'realized_revenue_eur', b.realized_revenue_eur,
      'realized_net_value_eur', b.realized_net_value_eur,
      'realized_roi', b.realized_roi,
      'environmental_factor_coverage', b.environmental_factor_coverage,
      'business_value_status', b.business_value_status
    ),
    jsonb_build_object('metric', 'cost_and_resource_per_measured_business_value', 'direction', 'decrease_without_quality_value_security_or_compliance_regression'),
    case when b.realized_revenue_eur is null then 0.60 else 0.85 end,
    case when b.realized_revenue_eur is null then 'review_required' else 'safe_reversible' end,
    jsonb_build_object('action', 'run_bounded_routing_caching_batching_or_prompt_efficiency_experiment', 'requires_baseline', true, 'requires_exact_candidate_evidence', true),
    jsonb_build_object('action', 'restore_last_known_good_configuration_or_candidate_sha', 'required', true),
    'candidate',
    'BG169',
    'resource-efficiency-daily-v1',
    'Generated from measured canonical resource/business-value evidence; expected impact expresses direction only, not an invented savings claim.'
  from public.powerhouse_business_value_intelligence_v1 b
  cross join lateral unnest(tenant_ids) as t(tenant_id)
  where b.observed_cost_eur > 0
    and (b.realized_roi is null or b.realized_roi < 1 or b.realized_net_value_eur < 0)
  on conflict (source_key) do nothing;

  get diagnostics inserted_count = row_count;

  insert into public.powerhouse_optimization_candidate_v1 (
    source_key, tenant_id, component_id, owner_agent, opportunity_type, baseline, expected_impact,
    confidence, safety_class, proposed_action, rollback_plan, status, production_authority,
    learning_fingerprint, notes
  )
  select
    'physical-telemetry-coverage:' || to_char(day, 'YYYY-MM-DD') || ':' || tenant_id || ':' || provider || ':' || resource_type || ':' || unit,
    tenant_id,
    'powerhouse-resource-intelligence-v1',
    'agent-integration-make',
    'physical_telemetry_coverage',
    jsonb_build_object('day', day, 'tenant_id', tenant_id, 'provider', provider, 'resource_type', resource_type, 'unit', unit, 'factor_coverage', factor_coverage, 'energy_kwh', energy_kwh, 'co2e_kg', co2e_kg, 'water_liters', water_liters, 'min_factor_confidence', min_factor_confidence, 'provenance_complete', provenance_complete),
    jsonb_build_object('metric', 'physical_telemetry_provenance_coverage', 'direction', 'increase'),
    0.95,
    'review_required',
    jsonb_build_object('action', 'identify_provider_supported_measurement_or_evidence_source_before_reporting_or_automation'),
    jsonb_build_object('action', 'remove_unproven_adapter_or_factor_and_restore_NULL_unknown_semantics', 'required', true),
    'candidate',
    'BG169',
    'physical-telemetry-provenance-v1',
    'Missing physical telemetry is intentionally NULL and becomes an evidence obligation, never synthetic zero.'
  from public.powerhouse_resource_intelligence_daily_v1
  where day >= date_trunc('day', now()) - interval '1 day'
    and (factor_coverage < 1 or energy_kwh is null or co2e_kg is null or water_liters is null or provenance_complete is not true)
  on conflict (source_key) do nothing;

  get diagnostics second_count = row_count;
  return inserted_count + second_count;
end;
$$;

revoke execute on function public.powerhouse_generate_resource_optimization_candidates_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_generate_resource_optimization_candidates_v1() to service_role;

commit;
