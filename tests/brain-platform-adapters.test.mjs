import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

test('all governed external platforms inherit one universal Brain adapter contract', async () => {
  const config = await readJson('config/brain-platform-adapters.json');
  assert.equal(config.contract, 'BRAIN-PLATFORM-ADAPTER-v1');
  assert.equal(config.activation.mode, 'fail_closed');
  assert.equal(config.activation.auto_registration, true);
  const required = ['github','netlify','make','notion','supabase','dataforseo'];
  const byPlatform = new Map(config.platforms.map(item => [item.platform, item]));
  for (const platform of required) {
    const adapter = byPlatform.get(platform);
    assert.ok(adapter, `${platform} adapter missing`);
    assert.equal(adapter.regression_contract, 'required');
    assert.equal(adapter.direct_promotion, true);
    assert.equal(adapter.authority, 'BG169');
    assert.ok(String(adapter.compatibility_mapping).startsWith('versioned'));
  }
});

test('future apps agents and scenarios fail closed without compatibility and regression contracts', async () => {
  const config = await readJson('config/brain-platform-adapters.json');
  assert.equal(config.future_components.inherit_automatically, true);
  assert.equal(config.future_components.unknown_adapter, 'fail_closed');
  assert.equal(config.future_components.no_production_without_contract, true);
  assert.ok(config.activation.production_ready_requires.includes('compatibility_mapping'));
  assert.ok(config.activation.production_ready_requires.includes('regression_contract'));
  assert.ok(config.activation.production_ready_requires.includes('exact_revision_evidence'));
});

test('executive cockpit integration health is a mandatory cross-platform projection', async () => {
  const config = await readJson('config/brain-platform-adapters.json');
  assert.deepEqual(config.telemetry_contract.required_fields, ['health','freshness','error','owner','cost','revision','last_verified_at']);
  assert.equal(config.telemetry_contract.projection, 'executive_cockpit');
  assert.equal(config.telemetry_contract.memory, 'BG167');
  assert.equal(config.telemetry_contract.error_ledger, 'BG166');
  assert.equal(config.telemetry_contract.outcome_router, 'BG168');
});

test('action and verified value semantics are universal, not app-specific', async () => {
  const config = await readJson('config/brain-platform-adapters.json');
  assert.deepEqual(config.outcome_contract.done_requires, ['owner','executed','verified','result','evidence']);
  assert.deepEqual(config.outcome_contract.realised_value_requires, ['realised','verified','evidence']);
  assert.deepEqual(config.outcome_contract.recommendation_loop, ['recommendation','owner','execution','verification','measurement','learning']);
});

test('canonical product gaps are represented as shared services instead of separate app truths', async () => {
  const config = await readJson('config/brain-platform-adapters.json');
  assert.deepEqual(config.canonical_services, [
    'business_graph',
    'change_impact',
    'external_intelligence',
    'decision_lifecycle',
    'action_execution',
    'verified_value',
    'living_memory',
    'ai_governance'
  ]);
});
