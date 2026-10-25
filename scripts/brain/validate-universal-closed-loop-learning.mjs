import fs from 'node:fs';

export function validateContract(contract) {
  const errors = [];
  const requiredCanonical = ['error_ingress','inventory','learning_router','learning_writer','shared_context'];
  const requiredLifecycle = ['detect','evidence','normalize','fingerprint','known_error_match','stateful_dedupe','owner_assignment','bounded_self_heal','regression_test','retest','idempotent_side_effect','outcome_verification','learning_writeback','shared_context_refresh','prevention_reuse'];
  const requiredFields = ['fingerprint','event_kind','stage','component_type','component_id','owner','reason','rootCause','failedApproach','fix','preventionRule','regressionTest','evidence','status','first_seen','last_seen','last_changed','evidence_hash','retry_budget','required_intervention','next_escalation_at'];

  if (contract?.version !== 'BRAIN-CLOSED-LOOP-v1') errors.push('version');
  if (contract?.scope !== 'estate-wide') errors.push('scope');
  for (const key of requiredCanonical) {
    const item = contract?.canonical?.[key];
    if (!item || !Number.isInteger(item.scenario_id) || item.scenario_id <= 0) errors.push(`canonical.${key}`);
  }
  // BG169 Make was retired; a static Make scenario identifier is not an active production authority.
  const authority = contract?.canonical?.production_authority || {};
  if (authority.transport !== 'github-native' ||
      authority.workflow !== '.github/workflows/unified-brain-delivery.yml' ||
      authority.exact_head_required !== true ||
      authority.protected_main_required !== true ||
      authority.production_readback_required !== true ||
      Object.hasOwn(authority, 'scenario_id')) errors.push('canonical.production_authority.github_native_only');
  const legacy = contract?.retired_make_routes?.bg169_production_controller || {};
  if (legacy.scenario_id !== 7137190 || legacy.status !== 'RETIRED_NO_REACTIVATION') errors.push('retired_make_routes.bg169');
  if (contract?.runtime_evidence_boundaries?.contract_validation_is_not_live_proof !== true ||
      contract?.runtime_evidence_boundaries?.verified_provider_outcome_required !== true) errors.push('runtime_evidence_boundaries');
  for (const stage of requiredLifecycle) if (!contract?.required_lifecycle?.includes(stage)) errors.push(`lifecycle.${stage}`);
  for (const field of requiredFields) if (!contract?.required_learning_fields?.includes(field)) errors.push(`field.${field}`);

  const p = contract?.policies || {};
  for (const key of ['read_shared_context_before_material_work','match_before_hypothesis','dedupe_before_write','dedupe_before_context_refresh','verify_external_outcome_before_green','no_second_persistent_memory','new_components_inherit_contract','make_inventory_auto_discovers_components','event_driven_preferred','deep_inspection_only_on_changed_or_error_evidence','agent_preflight_reuses_canonical_incident_memory','material_errors_incidents_and_improvements_write_back','daily_verified_improvement_review_required','portal_relevance_uses_existing_tenant_learning']) {
    if (p[key] !== true) errors.push(`policy.${key}`);
  }
  if (p.max_identical_retries_per_hypothesis !== 2) errors.push('policy.max_identical_retries_per_hypothesis');

  const g = contract?.cost_guards || {};
  for (const key of ['fleet_wide_per_scenario_polling_for_errors','retired_gmail_runtime_guards_may_be_reactivated','duplicate_learning_triggers_persistent_write','duplicate_learning_triggers_context_refresh','identical_retry_without_new_evidence']) {
    if (g[key] !== false) errors.push(`cost_guard.${key}`);
  }

  const forbidden = new Set(contract?.forbidden || []);
  for (const rule of ['parallel_isolated_agent_memory','fleet_wide_expensive_error_polling','reintroduce_retired_runtime_error_guards','skip_bg168_for_material_learning','skip_bg166_dedupe_writer','production_green_without_bg169_and_exact_production_identity','production_green_without_github_native_exact_production_identity']) {
    if (!forbidden.has(rule)) errors.push(`forbidden.${rule}`);
  }

  const portal = contract?.portal_relevance || {};
  if (portal.page_id !== 'learning-writeback') errors.push('portal_relevance.page_id');
  if (portal.authenticated_tenant_projection !== 'portal.runtime.learning.items') errors.push('portal_relevance.authenticated_tenant_projection');
  if (portal.projection_authority !== 'brain-operating-loop') errors.push('portal_relevance.projection_authority');
  for (const key of ['no_parallel_learning_store','never_claim_proven_without_runtime_evidence']) {
    if (portal[key] !== true) errors.push(`portal_relevance.${key}`);
  }
  const improvement = contract?.daily_improvement || {};
  if (improvement.existing_owner !== 'Powerhouse Daily Self Evolution' || improvement.schedule_reuse_required !== true) errors.push('daily_improvement.existing_owner');
  for (const key of ['verified_repeat_incidents','time_to_recovery','regression_coverage','customer_value']) {
    if (!improvement.optimize_for?.includes(key)) errors.push(`daily_improvement.metric.${key}`);
  }
  for (const key of ['representative_eval','regression','security','protected_main','production_readback','canonical_learning_writeback']) {
    if (!improvement.promotion_requires?.includes(key)) errors.push(`daily_improvement.promotion.${key}`);
  }
  if (improvement.no_unverified_green !== true) errors.push('daily_improvement.no_unverified_green');

  return { ok: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2] || 'config/universal-closed-loop-learning.json';
  const contract = JSON.parse(fs.readFileSync(path, 'utf8'));
  const result = validateContract(contract);
  if (!result.ok) {
    console.error(JSON.stringify({ status: 'UNIVERSAL_CLOSED_LOOP_FAILED', errors: result.errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ status: 'UNIVERSAL_CLOSED_LOOP_CONTRACT_VALIDATED', version: contract.version, scope: contract.scope }, null, 2));
}
