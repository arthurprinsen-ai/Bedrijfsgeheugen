import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contract = JSON.parse(
  readFileSync(new URL('../config/make-scenario-admission-contract.json', import.meta.url), 'utf8')
);

const ruleIds = new Set(contract.rules.map((rule) => rule.id));
const requiredFields = new Set(contract.required_fields);
const regressionCases = new Set(contract.mandatory_regression_cases);

const requiredRuleIds = [
  'DOMAIN_ELIGIBILITY_BEFORE_GENERIC_DATAHUB_CONSUMPTION',
  'DEDUPE_BEFORE_EXPENSIVE_WORK',
  'BOUNDED_SOURCE_READ',
  'PROJECT_CONSUMED_FIELDS',
  'CHEAP_DETERMINISTIC_GATE_FIRST',
  'AI_ONLY_FOR_MATERIAL_UNCERTAINTY',
  'NO_BLIND_POLLING_OR_FREQUENCY_INCREASE',
  'API_SEMANTICS_PROVEN_BEFORE_PRODUCTION',
  'SHADOW_BEFORE_SOURCE_TRIGGER_CUTOVER',
  'SEMANTIC_OUTCOME_NOT_JUST_TECHNICAL_SUCCESS',
  'RATE_LIMIT_DISCIPLINE',
  'LEARNING_FABRIC_REQUIRED',
  'PROTECTED_METRIC_REGRESSION_LIMIT',
];

const requiredAdmissionFields = [
  'canonical_owner',
  'authoritative_source',
  'domain_eligibility',
  'stable_identity_or_dedupe_key',
  'trigger_rationale',
  'max_batch_or_bounded_window',
  'cache_or_delta_strategy',
  'ai_justification',
  'expected_cost_and_transfer',
  'protected_metrics',
  'rollback_identity_or_plan',
  'compatibility_mapping',
  'learning_writeback',
];

test('Make admission contract is fail-closed and versioned', () => {
  assert.equal(contract.contract_id, 'MAKE-SCENARIO-ADMISSION-v1');
  assert.equal(contract.version, 1);
  assert.match(contract.promotion_decision.fail, /fail closed/i);
});

test('all mandatory low-cost architecture rules exist', () => {
  for (const id of requiredRuleIds) {
    assert.equal(ruleIds.has(id), true, `missing admission rule ${id}`);
  }
});

test('new scenarios must declare all admission evidence fields', () => {
  for (const field of requiredAdmissionFields) {
    assert.equal(requiredFields.has(field), true, `missing required field ${field}`);
  }
});

test('known chat-proven regressions are machine-enforced', () => {
  const requiredCases = [
    'generic_datahub_system_record_must_not_enter_commercial_scorer',
    'already_processed_record_must_stop_before_write',
    'empty_notion_search_bundle_must_stop_without_identity',
    'array_query_serialization_returns_all_expected_items',
    'routine_agent_healthcheck_must_not_create_false_error_learning',
    'overlapping_expensive_run_must_stop_before_ai',
    'window_ineligible_guardian_must_stop_before_inventory',
    'source_trigger_migration_requires_shadow_equivalence',
  ];

  for (const id of requiredCases) {
    assert.equal(regressionCases.has(id), true, `missing regression case ${id}`);
  }
});

test('cross-domain corruption and BG89 generic scoring fingerprints remain attached', () => {
  const allFingerprints = contract.rules.flatMap((rule) => rule.fingerprints || []);
  assert.ok(allFingerprints.includes('bg145|control-plane-semantic-corruption|commercial-writeback-cross-domain'));
  assert.ok(allFingerprints.includes('bg89|generic-datahub-watch|noncommercial-record-scoring'));
});
