begin;

create table if not exists public.powerhouse_compliance_evidence_v1 (
  evidence_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  observed_at timestamptz not null default now(),
  control_key text not null,
  requirement_key text not null,
  subject_type text not null,
  subject_id text not null,
  evidence_status text not null check (evidence_status in ('evidence_present','evidence_missing','not_applicable','review_required')),
  evidence_refs jsonb not null default '[]'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  review_required boolean not null default false,
  reviewer_note text,
  source_key text not null unique,
  notes text
);

alter table public.powerhouse_compliance_evidence_v1 enable row level security;
alter table public.powerhouse_compliance_evidence_v1 force row level security;
revoke all on public.powerhouse_compliance_evidence_v1 from public, anon, authenticated;
grant select, insert, update on public.powerhouse_compliance_evidence_v1 to service_role;

create table if not exists public.powerhouse_optimization_candidate_v1 (
  candidate_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_key text not null unique,
  component_id text not null,
  owner_agent text,
  opportunity_type text not null,
  baseline jsonb not null default '{}'::jsonb,
  expected_impact jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  safety_class text not null check (safety_class in ('safe_reversible','review_required','blocked_hard_boundary')),
  proposed_action jsonb not null default '{}'::jsonb,
  rollback_plan jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate','approved_by_policy','executing','measuring','kept','rolled_back','rejected','blocked')),
  production_authority text not null default 'BG169' check (production_authority = 'BG169'),
  measured_outcome jsonb,
  outcome_evidence jsonb,
  learning_fingerprint text,
  notes text
);

create index if not exists powerhouse_optimization_candidate_v1_status_idx
  on public.powerhouse_optimization_candidate_v1 (status, safety_class, confidence desc, created_at);

alter table public.powerhouse_optimization_candidate_v1 enable row level security;
alter table public.powerhouse_optimization_candidate_v1 force row level security;
revoke all on public.powerhouse_optimization_candidate_v1 from public, anon, authenticated;
grant select, insert, update on public.powerhouse_optimization_candidate_v1 to service_role;

create or replace view public.powerhouse_resource_intelligence_daily_v1
with (security_invoker = true)
as
select
  date_trunc('day', occurred_at) as day,
  tenant_id,
  source as provider,
  resource_type,
  unit,
  count(*)::bigint as usage_events,
  sum(amount) as resource_amount,
  count(factor_id)::bigint as factor_observations,
  case when count(*) > 0 then count(factor_id)::numeric / count(*)::numeric else null end as factor_coverage,
  sum(energy_kwh) filter (where energy_kwh is not null) as energy_kwh,
  sum(co2e_kg) filter (where co2e_kg is not null) as co2e_kg,
  sum(water_liters) filter (where water_liters is not null) as water_liters,
  min(confidence) filter (where factor_id is not null) as min_factor_confidence,
  bool_and(factor_id is null or (methodology is not null and confidence is not null)) as provenance_complete
from public.powerhouse_resource_impact_v1
group by 1,2,3,4,5;

revoke all on public.powerhouse_resource_intelligence_daily_v1 from public, anon, authenticated;
grant select on public.powerhouse_resource_intelligence_daily_v1 to service_role;

create or replace view public.powerhouse_business_value_intelligence_v1
with (security_invoker = true)
as
select
  action_id,
  dedupe_key,
  opportunity_key,
  subject_key,
  action_type,
  channel,
  status,
  expected_value_eur,
  resource_observations,
  calculated_impact_observations,
  energy_kwh,
  co2e_kg,
  water_liters,
  tenant_ids,
  provider_cost_eur,
  external_cost_eur,
  human_minutes,
  observed_cost_eur,
  realized_revenue_eur,
  realized_net_value_eur,
  realized_roi,
  environmental_factor_coverage,
  business_value_status
from public.powerhouse_action_business_value_v1;

revoke all on public.powerhouse_business_value_intelligence_v1 from public, anon, authenticated;
grant select on public.powerhouse_business_value_intelligence_v1 to service_role;

create or replace view public.powerhouse_resource_optimization_queue_v1
with (security_invoker = true)
as
select *
from public.powerhouse_optimization_candidate_v1
where status in ('candidate','approved_by_policy','executing','measuring')
order by
  case safety_class when 'safe_reversible' then 0 when 'review_required' then 1 else 2 end,
  confidence desc,
  created_at asc;

revoke all on public.powerhouse_resource_optimization_queue_v1 from public, anon, authenticated;
grant select on public.powerhouse_resource_optimization_queue_v1 to service_role;

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
    source_key, component_id, owner_agent, opportunity_type, baseline, expected_impact,
    confidence, safety_class, proposed_action, rollback_plan, status, production_authority,
    learning_fingerprint, notes
  )
  select
    'resource-efficiency:action:' || action_id::text,
    'powerhouse-resource-intelligence-v1',
    'agent-product-opportunity',
    'resource_efficiency',
    jsonb_build_object(
      'action_id', action_id,
      'observed_cost_eur', observed_cost_eur,
      'realized_revenue_eur', realized_revenue_eur,
      'realized_net_value_eur', realized_net_value_eur,
      'realized_roi', realized_roi,
      'environmental_factor_coverage', environmental_factor_coverage,
      'business_value_status', business_value_status
    ),
    jsonb_build_object('metric', 'cost_and_resource_per_measured_business_value', 'direction', 'decrease_without_quality_value_security_or_compliance_regression'),
    case when realized_revenue_eur is null then 0.60 else 0.85 end,
    case when realized_revenue_eur is null then 'review_required' else 'safe_reversible' end,
    jsonb_build_object('action', 'run_bounded_routing_caching_batching_or_prompt_efficiency_experiment', 'requires_baseline', true, 'requires_exact_candidate_evidence', true),
    jsonb_build_object('action', 'restore_last_known_good_configuration_or_candidate_sha', 'required', true),
    'candidate',
    'BG169',
    'resource-efficiency-daily-v1',
    'Generated from measured canonical resource/business-value evidence; expected impact expresses direction only, not an invented savings claim.'
  from public.powerhouse_business_value_intelligence_v1
  where observed_cost_eur > 0
    and (realized_roi is null or realized_roi < 1 or realized_net_value_eur < 0)
  on conflict (source_key) do nothing;

  get diagnostics inserted_count = row_count;

  insert into public.powerhouse_optimization_candidate_v1 (
    source_key, component_id, owner_agent, opportunity_type, baseline, expected_impact,
    confidence, safety_class, proposed_action, rollback_plan, status, production_authority,
    learning_fingerprint, notes
  )
  select
    'physical-telemetry-coverage:' || to_char(day, 'YYYY-MM-DD') || ':' || tenant_id || ':' || provider || ':' || resource_type || ':' || unit,
    'powerhouse-resource-intelligence-v1',
    'agent-integration-make',
    'physical_telemetry_coverage',
    jsonb_build_object(
      'day', day,
      'tenant_id', tenant_id,
      'provider', provider,
      'resource_type', resource_type,
      'unit', unit,
      'factor_coverage', factor_coverage,
      'energy_kwh', energy_kwh,
      'co2e_kg', co2e_kg,
      'water_liters', water_liters,
      'min_factor_confidence', min_factor_confidence,
      'provenance_complete', provenance_complete
    ),
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
  inserted_count := inserted_count + second_count;
  return inserted_count;
end;
$$;

revoke execute on function public.powerhouse_generate_resource_optimization_candidates_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_generate_resource_optimization_candidates_v1() to service_role;

do $$
begin
  if to_regnamespace('cron') is not null then
    perform cron.schedule(
      'powerhouse-resource-intelligence-daily-v1',
      '29 5 * * *',
      'select public.powerhouse_generate_resource_optimization_candidates_v1();'
    );
  end if;
end
$$;

commit;
