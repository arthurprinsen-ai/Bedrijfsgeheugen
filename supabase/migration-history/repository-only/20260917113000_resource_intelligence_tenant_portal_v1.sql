begin;

alter table public.powerhouse_compliance_evidence_v1
  add column if not exists tenant_id text;

alter table public.powerhouse_optimization_candidate_v1
  add column if not exists tenant_id text;

create index if not exists powerhouse_compliance_evidence_v1_tenant_idx
  on public.powerhouse_compliance_evidence_v1 (tenant_id, evidence_status, observed_at desc);

create index if not exists powerhouse_optimization_candidate_v1_tenant_idx
  on public.powerhouse_optimization_candidate_v1 (tenant_id, status, safety_class, confidence desc, created_at);

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
    'resource-efficiency:action:' || action_id::text,
    case when cardinality(tenant_ids) = 1 then tenant_ids[1] else null end,
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

commit;
