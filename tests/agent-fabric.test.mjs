import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';

const agents = [
  { id:'agent-ux', domains:['Website','UX'], capabilities:['analyze','design'] },
  { id:'agent-seo', domains:['Website','SEO'], capabilities:['analyze','optimize'] },
  { id:'agent-security', domains:['Security'], capabilities:['analyze','harden'] },
];

test('registry selects a deterministic primary owner and cross-domain support agents', () => {
  const registry = createAgentRegistry(agents);
  const routed = registry.route({ domains:['Website','SEO','UX'], capabilities:['analyze'] });
  assert.equal(routed.primaryAgentId, 'agent-seo');
  assert.deepEqual(routed.supportAgentIds, ['agent-ux']);
});

test('registry fails closed when no eligible agent exists', () => {
  const registry = createAgentRegistry(agents);
  assert.throws(
    () => registry.route({ domains:['Finance'], capabilities:['reconcile'] }),
    /no eligible agent/i,
  );
});

test('registry rejects duplicate agent identities', () => {
  assert.throws(
    () => createAgentRegistry([agents[0], { ...agents[0] }]),
    /duplicate agent id/i,
  );
});
