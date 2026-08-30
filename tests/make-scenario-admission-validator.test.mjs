import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMakeScenarioAdmission } from '../tools/make-scenario-admission-validator.mjs';

const validCandidate = {
  change_id: 'test-change',
  scenario_id: 'shadow-1',
  canonical_owner: 'PH14',
  authoritative_source: 'Interaction Datahub',
  domain_eligibility: {
    positive: ['commercial evidence'],
    negative: ['system', 'control', 'heartbeat', 'test'],
  },
  stable_identity_or_dedupe_key: 'Interaction Key',
  trigger_rationale: 'Bounded scheduled delta because source connector has no event projection path',
  max_batch_or_bounded_window: 10,
  cache_or_delta_strategy: 'Opportunity Updated is empty + projected fields',
  ai_justification: 'none; deterministic scorer',
  expected_cost_and_transfer: { credits_per_run_max: 10, transfer_bytes_per_run_max: 100000 },
  protected_metrics: ['inbound_dm_freshness', 'commercial_candidate_recall'],
  rollback_identity_or_plan: 'keep BG89 legacy active until shadow equivalence is proven',
  compatibility_mapping: { predecessor: 'BG89 v1', successor: 'BG89 v2 shadow' },
  learning_writeback: 'BG166/BG167 + GitHub learning ledger',
};

test('fails closed when mandatory admission fields are missing', () => {
  const result = validateMakeScenarioAdmission({
    scenario_id: 'bad-1',
    authoritative_source: 'generic datahub',
  });

  assert.equal(result.ok, false);
  assert.equal(result.decision, 'BLOCK_PROMOTION');
  assert.ok(result.missing.includes('domain_eligibility'));
  assert.ok(result.missing.includes('stable_identity_or_dedupe_key'));
  assert.ok(result.missing.includes('rollback_identity_or_plan'));
});

test('blocks generic Datahub consumer without explicit domain eligibility', () => {
  const candidate = { ...validCandidate, domain_eligibility: null };
  const result = validateMakeScenarioAdmission(candidate);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.rule === 'DOMAIN_ELIGIBILITY_BEFORE_GENERIC_DATAHUB_CONSUMPTION'));
});

test('blocks AI without a material uncertainty justification', () => {
  const candidate = { ...validCandidate, ai_justification: '' };
  const result = validateMakeScenarioAdmission(candidate);
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('ai_justification'));
});

test('passes a complete bounded shadow candidate', () => {
  const result = validateMakeScenarioAdmission(validCandidate);
  assert.equal(result.ok, true);
  assert.equal(result.decision, 'ADMISSION_PASS');
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.violations, []);
});
