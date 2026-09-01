import fs from 'node:fs';

export function validateContract(contract) {
  const errors = [];
  const requiredCanonical = ['error_ingress','inventory','learning_router','learning_writer','shared_context','production_authority'];
  const requiredLifecycle = ['detect','evidence','normalize','fingerprint','known_error_match','stateful_dedupe','owner_assignment','bounded_self_heal','regression_test','retest','idempotent_side_effect','outcome_verification','learning_writeback','shared_context_refresh','prevention_reuse'];
  const requiredFields = ['fingerprint','event_kind','stage','component_type','component_id','owner','reason','rootCause','failedApproach','fix','preventionRule','regressionTest','evidence','status','first_seen','last_seen','last_changed','evidence_hash','retry_budget','required_intervention','next_escalation_at'];

  if (contract?.version !== 'BRAIN-CLOSED-LOOP-v1') errors.push('version');
  if (contract?.scope !== 'estate-wide') errors.push('scope');
  for (const key of requiredCanonical) {
    const item = contract?.canonical?.[key];
    if (!item || !Number.isInteger(item.scenario_id) || item.scenario_id <= 0) errors.push(`canonical.${key}`);
  }
  for (const stage of requiredLifecycle) if (!contract?.required_lifecycle?.includes(stage)) errors.push(`lifecycle.${stage}`);
  for (const field of requiredFields) if (!contract?.required_learning_fields?.includes(field)) errors.push(`field.${field}`);

  const p = contract?.policies || {};
  for (const key of ['read_shared_context_before_material_work','match_before_hypothesis','dedupe_before_write','dedupe_before_context_refresh','verify_external_outcome_before_green','no_second_persistent_memory','new_components_inherit_contract','make_inventory_auto_discovers_components','event_driven_preferred','deep_inspection_only_on_changed_or_error_evidence']) {
    if (p[key] !== true) errors.push(`policy.${key}`);
  }
  if (p.max_identical_retries_per_hypothesis !== 2) errors.push('policy.max_identical_retries_per_hypothesis');

  const g = contract?.cost_guards || {};
  for (const key of ['fleet_wide_per_scenario_polling_for_errors','retired_gmail_runtime_guards_may_be_reactivated','duplicate_learning_triggers_persistent_write','duplicate_learning_triggers_context_refresh','identical_retry_without_new_evidence']) {
    if (g[key] !== false) errors.push(`cost_guard.${key}`);
  }

  const forbidden = new Set(contract?.forbidden || []);
  for (const rule of ['parallel_isolated_agent_memory','fleet_wide_expensive_error_polling','reintroduce_retired_runtime_error_guards','skip_bg168_for_material_learning','skip_bg166_dedupe_writer','production_green_without_bg169_and_exact_production_identity']) {
    if (!forbidden.has(rule)) errors.push(`forbidden.${rule}`);
  }

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
  console.log(JSON.stringify({ status: 'UNIVERSAL_CLOSED_LOOP_READY', version: contract.version, scope: contract.scope }, null, 2));
}
