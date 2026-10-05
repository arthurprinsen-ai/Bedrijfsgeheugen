import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const policyUrl = new URL('../config/brain-cost-policy.json', import.meta.url);
const skillUrl = new URL('../.agents/skills/powerhouse-resource-sustainability/SKILL.md', import.meta.url);
const systemMapUrl = new URL('../platform/system-map/canonical-system-map.mjs', import.meta.url);

test('all chats, agents and future connectors inherit universal cost governance', async () => {
  const policy = JSON.parse(await readFile(policyUrl, 'utf8'));
  const skill = await readFile(skillUrl, 'utf8');
  const systemMap = await readFile(systemMapUrl, 'utf8');

  assert.equal(policy.scope?.autoEnrollNewConnectedApps, true);
  assert.equal(policy.scope?.unregisteredConnectorDecision, 'APPLY_UNIVERSAL_DEFAULT_AND_REGISTER');
  assert.equal(policy.connectedAppGovernance?.cheapestSufficientRouteRequired, true);
  assert.equal(policy.connectedAppGovernance?.autonomousPaidPlanChangeAllowed, false);
  assert.equal(policy.connectedAppGovernance?.autonomousSubscriptionCancellationAllowed, false);
  assert.ok(policy.universalPlatformDefault?.meters?.includes('api_calls'));
  assert.ok(policy.universalPlatformDefault?.optimizations?.includes('cheapest_sufficient_capability'));

  for (const platform of ['supabase','notion','netlify','github','composio','dataforseo','tavily','google_search','google_analytics','gmail','google_calendar','google_drive','openart','placid','linkedin','instagram','salesrobot']) {
    assert.ok(policy.scope.appliesTo.includes(platform), `missing governed platform: ${platform}`);
  }

  assert.match(skill, /universal-connected-app-cost-governor/);
  assert.match(systemMap, /universal-connected-app-cost-governor-v1/);
  assert.match(systemMap, /powerhouse_resource_optimization_queue_v1/);
});
