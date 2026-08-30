import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createDeliveryPlan,
  discoverBrainMembership,
} from '../tools/brain-delivery-system.mjs';

test('backend website and portal changes become one parallel delivery unit', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: [
      'platform/api/brain-gateway.mjs',
      'components/header/template.html',
      'portal/core.mjs',
    ],
    headSha: 'abcdef1234567890',
    policy,
  });

  assert.equal(plan.contractVersion, 'BRAIN-DELIVERY-v1');
  assert.equal(plan.traceId, 'delivery|abcdef123456');
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend', 'portal', 'website']);
  assert.equal(plan.integration.required, true);
  assert.deepEqual(plan.integration.dependsOn, ['backend', 'portal', 'website']);
  assert.equal(plan.production.exactShaRequired, true);
  assert.equal(plan.production.authority, 'BG169');
});

test('shared contract changes fan out to every delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: ['config/outcome-obligations.json'],
    headSha: '1234567890abcdef',
    policy,
  });

  assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend', 'portal', 'website']);
});

test('new agents and workflow scenarios are automatically visible as Brain members', async () => {
  const membership = discoverBrainMembership({
    registeredComponents: [{ key: 'BG169', id: 7137190, status: 'active' }],
    agents: [{ id: 'agent-new-builder', domains: ['Website'] }],
    workflows: ['.github/workflows/new-builder.yml'],
  });

  assert.deepEqual(membership.map(item => item.componentKey), [
    'agent:agent-new-builder',
    'brain:BG169',
    'github-workflow:new-builder',
  ]);
  assert.equal(membership.every(item => item.brainContractVersion === 'brain.v1'), true);
  assert.equal(membership.every(item => item.costManaged === true), true);
  assert.equal(membership.every(item => item.outcomeWritebackRequired === true), true);
});

test('unknown active delivery work fails closed before production', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  assert.throws(() => createDeliveryPlan({
    changedPaths: ['unowned/new-system.mjs'],
    headSha: 'abcdef1234567890',
    policy,
  }), /unclassified delivery path/);
});

test('a future workflow is automatically classified as shared Brain delivery work', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: ['.github/workflows/future-agent-scenario.yml'],
    headSha: 'fedcba1234567890',
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['backend', 'portal', 'website']);
});

test('legacy customer portal changes belong to the portal lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({
    changedPaths: ['klantportaal.html'],
    headSha: '1234abcdef567890',
    policy,
  });
  assert.deepEqual(plan.lanes.map(lane => lane.id), ['portal']);
});

test('unified workflow executes changed lanes in parallel and integrates once', async () => {
  const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
  assert.match(workflow, /fromJSON\(needs\.plan\.outputs\.matrix\)/);
  assert.match(workflow, /needs:\s*plan/);
  assert.match(workflow, /needs:\s*\[plan, lanes\]/);
  assert.match(workflow, /node tools\/brain-delivery-system\.mjs/);
  assert.match(workflow, /npm install --ignore-scripts --no-audit --no-fund/);
  assert.match(workflow, /node scripts\/brain\/test-all\.mjs/);
  assert.match(workflow, /BG169/);
  assert.match(workflow, /BG168/);
  assert.match(workflow, /BG167/);
});
