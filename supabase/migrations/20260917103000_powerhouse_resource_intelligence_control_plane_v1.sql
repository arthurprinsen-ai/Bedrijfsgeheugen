-- Powerhouse Resource Intelligence control plane v1
-- Reuses brain_budget_usage/resource impact/action economics/value/evidence authorities.
-- No environmental factor is invented by this migration.

create table if not exists public.powerhouse_compliance_frameworks (
  framework_key text primary key,
  title text not null,
  jurisdiction text not null default 'EU',
  version_label text not null,
  source_url text not null,
  effective_from date,
  source_verified_at timestamptz not null,
  next_review_at timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUPERSEDED','DRAFT')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_compliance_controls (
  control_id text primary key,
  framework_key text not null references public.powerhouse_compliance_frameworks(framework_key) on update cascade,
  control_ref text not null,
  title text not null,
  requirement_summary text not null,
  applicability_hint text,
  evidence_requirements jsonb not null default '[]'::jsonb,
  source_url text not null,
  severity text not null default 'MATERIAL' check (severity in ('INFO','MATERIAL','HIGH','CRITICAL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(framework_key,control_ref)
);

create table if not exists public.powerhouse_compliance_assessments (
  assessment_id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  control_id text not null references public.powerhouse_compliance_controls(control_id) on update cascade,
  applicability text not null default 'UNKNOWN' check (applicability in ('APPLICABLE','NOT_APPLICABLE','UNKNOWN')),
  evidence_status text not null default 'UNKNOWN' check (evidence_status in ('EVIDENCED','PARTIAL','OPEN','UNKNOWN','NOT_APPLICABLE')),
  evidence_refs text[] not null default '{}'::text[],
  evidence_freshness text not null default 'UNKNOWN' check (evidence_freshness in ('FRESH','STALE','UNKNOWN')),
  rationale text,
  assessed_by text not null,
  assessed_at timestamptz not null default now(),
  next_review_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,control_id)
);

alter table public.powerhouse_compliance_frameworks enable row level security;
alter table public.powerhouse_compliance_controls enable row level security;
alter table public.powerhouse_compliance_assessments enable row level security;

revoke all on public.powerhouse_compliance_frameworks from anon, authenticated;
revoke all on public.powerhouse_compliance_controls from anon, authenticated;
revoke all on public.powerhouse_compliance_assessments from anon, authenticated;
grant select,insert,update on public.powerhouse_compliance_frameworks to service_role;
grant select,insert,update on public.powerhouse_compliance_controls to service_role;
grant select,insert,update on public.powerhouse_compliance_assessments to service_role;

insert into public.powerhouse_compliance_frameworks(framework_key,title,version_label,source_url,effective_from,source_verified_at,next_review_at,metadata)
values
 ('eu-ai-act-2026','EU AI Act','2026-08 Article 50 enforcement','https://digital-strategy.ec.europa.eu/en/news/commission-starts-enforcing-ai-act-rules-and-new-transparency-requirements-2-august','2026-08-02','2026-09-17T08:00:00Z','2026-10-17T08:00:00Z',jsonb_build_object('authority','European Commission','legal_conclusion',false)),
 ('nis2-eu','NIS2 Directive','Directive (EU) 2022/2555','https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs',null,'2026-09-17T08:00:00Z','2026-10-17T08:00:00Z',jsonb_build_object('authority','European Commission','legal_conclusion',false)),
 ('csrd-esrs-2026','CSRD / revised ESRS','Commission revised ESRS 2026','https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en',null,'2026-09-17T08:00:00Z','2026-10-17T08:00:00Z',jsonb_build_object('authority','European Commission','legal_conclusion',false))
on conflict (framework_key) do update set
 title=excluded.title, version_label=excluded.version_label, source_url=excluded.source_url,
 effective_from=excluded.effective_from, source_verified_at=excluded.source_verified_at,
 next_review_at=excluded.next_review_at, metadata=excluded.metadata, updated_at=now();

insert into public.powerhouse_compliance_controls(control_id,framework_key,control_ref,title,requirement_summary,applicability_hint,evidence_requirements,source_url,severity)
values
 ('eu-ai-act:article-50-interaction','eu-ai-act-2026','Article 50','AI interaction transparency','Where Article 50 applies, people must be informed that they interact with AI rather than a human.','Assess provider/deployer role and whether the interaction is obviously AI.',jsonb_build_array('use_case','transparency_notice','production_readback'),'https://digital-strategy.ec.europa.eu/en/factpages/quick-facts-transparency-rules-ai-systems','HIGH'),
 ('eu-ai-act:article-50-content','eu-ai-act-2026','Article 50','AI-generated or manipulated content transparency','Where applicable, generated or manipulated content needs the transparency/marking required by Article 50.','Assess content type, provider/deployer role and applicable exceptions.',jsonb_build_array('content_policy','marking_or_label_evidence','provider_capability'),'https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems','HIGH'),
 ('eu-ai-act:registry-oversight','eu-ai-act-2026','Governance evidence','AI inventory and human oversight','Maintain current use-case, model/provider, risk, human oversight, lifecycle and evidence information.','Operational readiness control; not itself a legal-compliance conclusion.',jsonb_build_array('brain_ai_governance_registry','human_oversight','review_evidence'),'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai','MATERIAL'),
 ('nis2:article-21-risk','nis2-eu','Article 21','Cybersecurity risk-management measures','Maintain evidence for incident handling, continuity, supply-chain security, vulnerability handling, cryptography/access controls and related risk measures.','First establish whether the entity is in scope and which national implementation applies.',jsonb_build_array('risk_register','security_controls','continuity_evidence','supplier_evidence'),'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs','CRITICAL'),
 ('nis2:article-23-reporting','nis2-eu','Article 23','Significant incident reporting readiness','For in-scope significant incidents the NIS2 process includes early warning, incident notification and final reporting deadlines.','Applicability and significant-incident criteria must be assessed before treating a deadline as active.',jsonb_build_array('incident_classification','detected_at','reporting_timeline','authority_evidence'),'https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs','CRITICAL'),
 ('csrd:applicability','csrd-esrs-2026','Scope','CSRD/ESRS applicability','Determine whether the entity is in mandatory CSRD scope or uses a voluntary standard; never infer scope from resource telemetry alone.','Entity/legal/size/value-chain facts required.',jsonb_build_array('entity_scope','reporting_boundary','applicability_rationale'),'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','HIGH'),
 ('csrd:materiality','csrd-esrs-2026','Materiality','Materiality and evidence','Track applicable/material topics, datapoints, provenance, freshness and evidence gaps.','Only report datapoints justified by scope/materiality and evidence.',jsonb_build_array('materiality_assessment','datapoint_evidence','provenance'),'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','HIGH'),
 ('csrd:digital-resource-lineage','csrd-esrs-2026','Resource lineage','Digital resource footprint evidence','Expose measured/provider-reported/calculated/modelled/estimated/unknown classes for digital energy, emissions and water impact.','Digital footprint is supporting evidence and must not be represented as the complete corporate footprint.',jsonb_build_array('brain_budget_usage','powerhouse_resource_factors','powerhouse_resource_impact_v1'),'https://finance.ec.europa.eu/news/commission-adopts-revised-sustainability-reporting-standards-2026-07-03_en','MATERIAL')
on conflict (control_id) do update set
 framework_key=excluded.framework_key,control_ref=excluded.control_ref,title=excluded.title,
 requirement_summary=excluded.requirement_summary,applicability_hint=excluded.applicability_hint,
 evidence_requirements=excluded.evidence_requirements,source_url=excluded.source_url,severity=excluded.severity,updated_at=now();

create or replace view public.powerhouse_compliance_readiness_v1
with (security_invoker=true) as
select
  a.tenant_id,
  c.framework_key,
  f.title as framework_title,
  f.version_label,
  f.source_url,
  f.source_verified_at,
  f.next_review_at as framework_next_review_at,
  count(*) filter (where a.applicability='APPLICABLE') as applicable_controls,
  count(*) filter (where a.applicability='NOT_APPLICABLE') as not_applicable_controls,
  count(*) filter (where a.applicability='UNKNOWN') as unknown_applicability_controls,
  count(*) filter (where a.evidence_status='EVIDENCED') as evidenced_controls,
  count(*) filter (where a.evidence_status='PARTIAL') as partial_controls,
  count(*) filter (where a.evidence_status='OPEN') as open_controls,
  count(*) filter (where a.evidence_status='UNKNOWN') as unknown_evidence_controls,
  count(*) filter (where a.evidence_freshness='STALE') as stale_controls,
  max(a.assessed_at) as last_assessed_at,
  case when count(*) filter (where a.applicability='APPLICABLE') > 0
       then (count(*) filter (where a.applicability='APPLICABLE' and a.evidence_status='EVIDENCED'))::numeric /
            (count(*) filter (where a.applicability='APPLICABLE'))::numeric
       else null end as evidence_coverage
from public.powerhouse_compliance_assessments a
join public.powerhouse_compliance_controls c using(control_id)
join public.powerhouse_compliance_frameworks f using(framework_key)
group by a.tenant_id,c.framework_key,f.title,f.version_label,f.source_url,f.source_verified_at,f.next_review_at;

revoke all on public.powerhouse_compliance_readiness_v1 from anon,authenticated;
grant select on public.powerhouse_compliance_readiness_v1 to service_role;

create or replace function public.powerhouse_resource_decision_gate_v1(
  p_reversible boolean,
  p_preapproved_policy boolean,
  p_security_pass boolean,
  p_correctness_pass boolean,
  p_tenant_isolation_pass boolean,
  p_compliance_pass boolean,
  p_external_communication boolean default false,
  p_destructive boolean default false,
  p_privilege_change boolean default false,
  p_material_spend boolean default false,
  p_quality_delta numeric default null,
  p_cost_delta numeric default null,
  p_energy_delta numeric default null
) returns jsonb
language plpgsql immutable
set search_path='public','pg_temp'
as $$
declare v_decision text;
begin
  if not coalesce(p_security_pass,false) or not coalesce(p_correctness_pass,false)
     or not coalesce(p_tenant_isolation_pass,false) or not coalesce(p_compliance_pass,false) then
    v_decision:='BLOCKED_GUARDRAIL';
  elsif coalesce(p_reversible,false) and coalesce(p_preapproved_policy,false)
     and not coalesce(p_external_communication,false) and not coalesce(p_destructive,false)
     and not coalesce(p_privilege_change,false) and not coalesce(p_material_spend,false)
     and (p_quality_delta is null or p_quality_delta >= 0) then
    v_decision:='AUTO_ALLOWED';
  else
    v_decision:='GOVERNED_OBLIGATION';
  end if;
  return jsonb_build_object(
    'decision',v_decision,
    'guardrails',jsonb_build_object(
      'security_non_degradation',coalesce(p_security_pass,false),
      'correctness_non_degradation',coalesce(p_correctness_pass,false),
      'tenant_isolation_non_degradation',coalesce(p_tenant_isolation_pass,false),
      'compliance_non_degradation',coalesce(p_compliance_pass,false),
      'quality_non_degradation',p_quality_delta is null or p_quality_delta >= 0),
    'resource_delta',jsonb_build_object('cost',p_cost_delta,'energy',p_energy_delta),
    'autonomy',jsonb_build_object('reversible',p_reversible,'preapproved_policy',p_preapproved_policy,'external_communication',p_external_communication,'destructive',p_destructive,'privilege_change',p_privilege_change,'material_spend',p_material_spend)
  );
end;$$;

revoke all on function public.powerhouse_resource_decision_gate_v1(boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function public.powerhouse_resource_decision_gate_v1(boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,numeric,numeric,numeric) to service_role;

create or replace function public.powerhouse_resource_intelligence_snapshot_v1(p_tenant_id text)
returns jsonb
language sql stable security definer
set search_path='public','pg_temp'
as $$
with usage30 as (
  select * from public.brain_budget_usage
  where occurred_at >= now()-interval '30 days'
    and entry_kind='USAGE'
    and coalesce(metadata->>'synthetic','false')<>'true'
    and coalesce(nullif(metadata->>'tenant_id',''),'canonical')=p_tenant_id
), classes as (
  select upper(coalesce(nullif(metadata->>'measurement_class',''),'UNKNOWN')) as measurement_class,count(*) as n
  from usage30 group by 1
), summary as (
  select to_jsonb(s) body from public.powerhouse_portal_resource_summary_v2 s where s.tenant_id=p_tenant_id
), compliance as (
  select coalesce(jsonb_agg(to_jsonb(r) order by r.framework_key),'[]'::jsonb) body
  from public.powerhouse_compliance_readiness_v1 r where r.tenant_id=p_tenant_id
), obligations as (
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',obligation_type,'entity',business_entity,'state',state,'updated_at',updated_at) order by updated_at desc),'[]'::jsonb) body
  from public.brain_obligations where capability_id='powerhouse-resource-intelligence-v1' and state not in ('FULFILLED','CANCELLED')
), class_counts as (
  select coalesce(jsonb_object_agg(measurement_class,n),'{}'::jsonb) body from classes
)
select jsonb_build_object(
  'tenant_id',p_tenant_id,
  'generated_at',now(),
  'window','30 days',
  'resource_summary',coalesce((select body from summary),'{}'::jsonb),
  'measurement_classes',(select body from class_counts),
  'usage_observations',(select count(*) from usage30),
  'compliance_readiness',(select body from compliance),
  'open_obligations',(select body from obligations),
  'provenance_contract',jsonb_build_array('MEASURED','PROVIDER_REPORTED','CALCULATED','MODELLED','ESTIMATED','UNKNOWN'),
  'truth_policy',jsonb_build_object('unknown_not_zero',true,'no_fake_precision',true,'legal_compliance_claim',false)
);$$;

revoke all on function public.powerhouse_resource_intelligence_snapshot_v1(text) from public,anon,authenticated;
grant execute on function public.powerhouse_resource_intelligence_snapshot_v1(text) to service_role;

create or replace function public.powerhouse_resource_intelligence_daily_v1(p_now timestamptz default now())
returns jsonb
language plpgsql security definer
set search_path='public','extensions','pg_temp'
as $$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_usage bigint:=0; v_missing_provenance bigint:=0; v_unknown_factor bigint:=0;
  v_stale_frameworks bigint:=0; v_hash text; v_record_id text; v_record public.brain_records;
  v_payload jsonb; v_obligation_id uuid;
begin
  select count(*),count(*) filter(where upper(coalesce(nullif(metadata->>'measurement_class',''),'UNKNOWN')) not in ('MEASURED','PROVIDER_REPORTED','CALCULATED','MODELLED','ESTIMATED'))
  into v_usage,v_missing_provenance
  from public.brain_budget_usage
  where occurred_at>=p_now-interval '24 hours' and entry_kind='USAGE' and coalesce(metadata->>'synthetic','false')<>'true';

  select count(*) into v_unknown_factor
  from public.powerhouse_resource_impact_v1
  where occurred_at>=p_now-interval '24 hours' and calculation_status='unknown_factor';

  select count(*) into v_stale_frameworks
  from public.powerhouse_compliance_frameworks
  where status='ACTIVE' and next_review_at<p_now;

  v_payload:=jsonb_build_object(
    'fingerprint','powerhouse-resource-intelligence-v1','run_date',v_date,'observed_at',p_now,
    'usage_observations_24h',v_usage,'missing_provenance_24h',v_missing_provenance,
    'unknown_environmental_factor_observations_24h',v_unknown_factor,'stale_compliance_frameworks',v_stale_frameworks,
    'optimizer',jsonb_build_object('mode','evidence_first','auto_apply','preapproved reversible low-risk only','provider_mutation_without_adapter',false),
    'guardrails',jsonb_build_array('security_non_degradation','correctness_non_degradation','tenant_isolation_non_degradation','compliance_non_degradation','quality_non_degradation','rollback_required'),
    'truth_policy',jsonb_build_object('unknown_not_zero',true,'no_fake_precision',true,'invented_value',false,'invented_environmental_factor',false)
  );

  if v_missing_provenance>0 then
    v_hash:=encode(digest(convert_to(('resource-provenance|'||v_missing_provenance)::text,'UTF8'),'sha256'),'hex');
    insert into public.brain_obligations(obligation_type,capability_id,business_entity,business_period,business_timezone,payload_sha256,owner,state,evidence)
    values('RESOURCE_TELEMETRY_GAP','powerhouse-resource-intelligence-v1','measurement-provenance','continuous','Europe/Amsterdam',v_hash,'Powerhouse Resource Intelligence','OPEN',jsonb_build_object('missing_provenance_24h',v_missing_provenance,'decision','GOVERNED_OBLIGATION'))
    on conflict(obligation_type,capability_id,business_entity,business_period,business_timezone) do update set payload_sha256=excluded.payload_sha256,state='OPEN',evidence=excluded.evidence,updated_at=now(),version=brain_obligations.version+1
    returning id into v_obligation_id;
  end if;

  if v_unknown_factor>0 then
    v_hash:=encode(digest(convert_to(('resource-factor|'||v_unknown_factor)::text,'UTF8'),'sha256'),'hex');
    insert into public.brain_obligations(obligation_type,capability_id,business_entity,business_period,business_timezone,payload_sha256,owner,state,evidence)
    values('RESOURCE_FACTOR_GAP','powerhouse-resource-intelligence-v1','environmental-factor-coverage','continuous','Europe/Amsterdam',v_hash,'Powerhouse Resource Intelligence','OPEN',jsonb_build_object('unknown_factor_observations_24h',v_unknown_factor,'rule','factor must have authoritative source/methodology/confidence; never invent','decision','GOVERNED_OBLIGATION'))
    on conflict(obligation_type,capability_id,business_entity,business_period,business_timezone) do update set payload_sha256=excluded.payload_sha256,state='OPEN',evidence=excluded.evidence,updated_at=now(),version=brain_obligations.version+1;
  end if;

  if v_stale_frameworks>0 then
    v_hash:=encode(digest(convert_to(('compliance-source-refresh|'||v_stale_frameworks)::text,'UTF8'),'sha256'),'hex');
    insert into public.brain_obligations(obligation_type,capability_id,business_entity,business_period,business_timezone,payload_sha256,owner,state,evidence)
    values('COMPLIANCE_SOURCE_REFRESH','powerhouse-resource-intelligence-v1','legal-source-refresh','continuous','Europe/Amsterdam',v_hash,'Powerhouse Resource Intelligence','OPEN',jsonb_build_object('stale_frameworks',v_stale_frameworks,'rule','refresh from official authority before compliance conclusions','decision','GOVERNED_OBLIGATION'))
    on conflict(obligation_type,capability_id,business_entity,business_period,business_timezone) do update set payload_sha256=excluded.payload_sha256,state='OPEN',evidence=excluded.evidence,updated_at=now(),version=brain_obligations.version+1;
  end if;

  v_record_id:='resource-intelligence:'||to_char(v_date,'YYYYMMDD');
  select * into v_record from public.brain_append_record(
    'canonical',v_record_id,'CurrentState','current_state','bedrijfsgeheugen-powerhouse',
    'powerhouse-resource-intelligence-v1:'||v_date::text,array[]::text[],'powerhouse-resource-intelligence-v1',
    case when v_missing_provenance+v_unknown_factor+v_stale_frameworks=0 then 'VERIFIED' else 'OBSERVED' end,
    p_now,true,true,
    jsonb_build_object('usage_observations_24h',v_usage,'missing_provenance_24h',v_missing_provenance,'unknown_factor_24h',v_unknown_factor,'stale_frameworks',v_stale_frameworks),
    array[]::text[],jsonb_build_object('source','supabase_pg_cron','authority','canonical','timezone','Europe/Amsterdam'),
    v_payload,'powerhouse-resource-intelligence-v1:'||v_date::text,'powerhouse-resource-intelligence-v1'
  );

  return jsonb_build_object('run_date',v_date,'record_id',v_record.record_id,'usage_observations_24h',v_usage,'missing_provenance_24h',v_missing_provenance,'unknown_factor_24h',v_unknown_factor,'stale_frameworks',v_stale_frameworks,'state',case when v_missing_provenance+v_unknown_factor+v_stale_frameworks=0 then 'VERIFIED' else 'OBLIGATIONS_OPEN' end);
end;$$;

revoke all on function public.powerhouse_resource_intelligence_daily_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_resource_intelligence_daily_v1(timestamptz) to service_role;

-- Idempotent daily scheduler. Function itself keys state by Europe/Amsterdam date.
do $$ begin
  if exists(select 1 from cron.job where jobname='powerhouse-resource-intelligence-daily-v1') then
    perform cron.unschedule('powerhouse-resource-intelligence-daily-v1');
  end if;
  perform cron.schedule('powerhouse-resource-intelligence-daily-v1','37 4 * * *','select public.powerhouse_resource_intelligence_daily_v1(now());');
end $$;

comment on function public.powerhouse_resource_decision_gate_v1 is 'Canonical Resource Intelligence autonomy gate: AUTO_ALLOWED only for preapproved reversible low-risk changes with all non-degradation guardrails green.';
comment on function public.powerhouse_resource_intelligence_daily_v1 is 'Daily evidence-first optimizer/readiness cycle; creates canonical obligations for telemetry, environmental-factor and compliance-source gaps without inventing measurements.';
