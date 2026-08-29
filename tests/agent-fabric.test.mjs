import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRegistry } from '../platform/agents/agent-registry.mjs';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';

const agents = [
  { id:'agent-ux', domains:['Website','UX'], capabilities:['analyze','design'] },
  { id:'agent-seo', domains:['Website','SEO'], capabilities:['analyze','optimize'] },
  { id:'agent-security', domains:['Security'], capabilities:['analyze','harden'] },
  { id:'agent-cost', domains:['Cost','Operations'], capabilities:['analyze','optimize'] },
];

const registry = () => createAgentRegistry(agents);

test('registry selects a deterministic primary owner and cross-domain support agents', () => {
  const routed = registry().route({ domains:['Website','SEO','UX'], capabilities:['analyze'] });
  assert.equal(routed.primaryAgentId, 'agent-seo');
  assert.deepEqual(routed.supportAgentIds, ['agent-ux']);
});

test('registry fails closed when no eligible agent exists', () => {
  assert.throws(
    () => registry().route({ domains:['Finance'], capabilities:['reconcile'] }),
    /no eligible agent/i,
  );
});

test('registry rejects duplicate agent identities', () => {
  assert.throws(
    () => createAgentRegistry([agents[0], { ...agents[0] }]),
    /duplicate agent id/i,
  );
});

test('duplicate active signals collapse into one shared AgentWork item', () => {
  const fabric = createAgentFabric({ registry:registry(), now:() => '2026-08-29T12:00:00.000Z' });
  const signal = {
    tenantId:'TENANT-A', kind:'Failure', problemClass:'website-regression', priority:'P1',
    domains:['Website','SEO'], capabilities:['analyze'], affectedObjectIds:['page-home'],
    problem:'Homepage metadata regressed', evidence:['seo-check-1'],
  };
  const first = fabric.intake(signal);
  const second = fabric.intake({ ...signal, evidence:['seo-check-2'] });
  assert.equal(first.id, second.id);
  assert.equal(fabric.listWork({ tenantId:'TENANT-A' }).length, 1);
  assert.equal(first.primaryAgentId, 'agent-seo');
});

test('cross-domain intake creates one owner with collaborating support agents', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({
    tenantId:'TENANT-A', kind:'Failure', problemClass:'website-change', priority:'P1',
    domains:['Website','SEO','UX','Security'], capabilities:['analyze'], affectedObjectIds:['page-pricing'],
    problem:'Pricing page change impacts multiple domains', evidence:['change-17'],
  });
  assert.equal(work.primaryAgentId, 'agent-seo');
  assert.deepEqual(work.supportAgentIds, ['agent-ux','agent-security']);
  assert.equal(work.status, 'Assigned');
});

test('AgentWork transitions through the shared lifecycle and rejects invalid jumps', () => {
  const fabric = createAgentFabric({ registry:registry() });
  const work = fabric.intake({
    tenantId:'TENANT-A', kind:'Failure', problemClass:'cost-spike', priority:'P2',
    domains:['Cost'], capabilities:['analyze'], affectedObjectIds:['make-scenario-4'], problem:'Operations cost spike',
  });
  const investigating = fabric.transition({ workId:work.id, status:'Investigating', evidence:['cost-trace'] });
  assert.equal(investigating.status, 'Investigating');
  assert.deepEqual(investigating.evidence, ['cost-trace']);
  assert.throws(() => fabric.transition({ workId:work.id, status:'Resolved' }), /invalid AgentWork transition/i);
});
