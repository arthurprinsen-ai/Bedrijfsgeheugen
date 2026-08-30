import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComponentCatalog } from '../platform/cost/component-catalog.mjs';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';

const NOW = () => '2026-08-30T09:00:00Z';

test('new active Make scenario appears without a static allowlist and optional work fails closed', () => {
  const catalog = buildComponentCatalog({
    makeScenarios: [{ id: 999, name: 'BG999 New Worker', isActive: true, trigger: 'scheduled' }],
    agents: [],
    overrides: {},
    now: NOW,
  });

  assert.equal(catalog.get('make:999').name, 'BG999 New Worker');
  assert.equal(catalog.get('make:999').classificationState, 'UNCLASSIFIED');
  assert.equal(catalog.get('make:999').runDecision, 'BUDGET_DEFERRED');
  assert.equal(catalog.get('make:999').active, true);
});

test('new registered agent appears automatically', () => {
  const catalog = buildComponentCatalog({
    makeScenarios: [],
    agents: [{ id: 'agent-new', domains: ['Cost'], capabilities: ['measure'] }],
    overrides: {},
    now: NOW,
  });

  assert.equal(catalog.get('agent:agent-new').kind, 'AGENT');
});

test('protected agent domains classify deterministically', () => {
  const catalog = buildComponentCatalog({
    makeScenarios: [],
    agents: [{ id: 'agent-sec', domains: ['Security'], capabilities: ['verify'] }],
    overrides: {},
    now: NOW,
  });

  assert.equal(catalog.get('agent:agent-sec').costClass, 'production_core');
  assert.equal(catalog.get('agent:agent-sec').runDecision, 'RUN');
});

test('registry preserves immutable cost profile as agent-owned metadata', () => {
  const registry = createAgentRegistry([{
    id: 'agent-cost',
    domains: ['Cost'],
    capabilities: ['measure'],
    costProfile: { costClass: 'shared_memory_control', owner: 'agent-cost' },
  }]);

  assert.deepEqual(registry.get('agent-cost').costProfile, {
    costClass: 'shared_memory_control',
    owner: 'agent-cost',
  });
  assert.equal(Object.isFrozen(registry.get('agent-cost').costProfile), true);
});

test('duplicate component identities are rejected instead of silently overwritten', () => {
  assert.throws(() => buildComponentCatalog({
    makeScenarios: [{ id: 999, name: 'First' }, { id: 999, name: 'Duplicate' }],
    now: NOW,
  }), /duplicate component key/);
});
