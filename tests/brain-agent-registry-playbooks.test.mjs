import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';

test('registry exposes immutable per-agent tasks, playbooks and learning contracts without changing routing', () => {
  const registry = createAgentRegistry([
    {
      id:'agent-seo',
      domains:['Website','SEO'],
      capabilities:['analyze','optimize'],
      tasks:['audit-serp','improve-content'],
      playbooks:['seo-regression-recovery','content-opportunity'],
      learningContracts:['seo.v1','outcome.v1'],
    },
  ]);

  const agent = registry.get('agent-seo');
  assert.deepEqual(agent.tasks, ['audit-serp','improve-content']);
  assert.deepEqual(agent.playbooks, ['seo-regression-recovery','content-opportunity']);
  assert.deepEqual(agent.learningContracts, ['seo.v1','outcome.v1']);
  assert.equal(Object.isFrozen(agent.tasks), true);
  assert.equal(Object.isFrozen(agent.playbooks), true);
  assert.equal(Object.isFrozen(agent.learningContracts), true);
  assert.deepEqual(registry.route({ domains:['SEO'], capabilities:['optimize'] }), {
    primaryAgentId:'agent-seo',
    supportAgentIds:[],
  });
});
