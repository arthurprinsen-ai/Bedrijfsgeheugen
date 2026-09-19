import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('resource sustainability governor is canonical and fail-closed', async () => {
  const policy=JSON.parse(await readFile('config/brain-cost-policy.json','utf8'));
  const agents=await readFile('AGENTS.md','utf8');
  const skill=await readFile('.agents/skills/powerhouse-resource-sustainability/SKILL.md','utf8');

  assert.equal(policy.schemaVersion,2);
  assert.equal(policy.authority,'ONE_BRAIN');
  assert.equal(policy.governance.preflightRequired,true);
  assert.equal(policy.governance.postflightRequired,true);
  assert.equal(policy.governance.paidCapacityIncreaseAllowedAutonomously,false);
  for (const platform of ['supabase','netlify','notion','github','composio','openart','placid']) {
    assert.ok(policy.platforms[platform], 'missing governed platform '+platform);
    assert.ok(policy.platforms[platform].meters.length>0);
    assert.ok(policy.platforms[platform].optimizations.length>0);
  }
  assert.equal(policy.sustainability.neverPresentEstimateAsMeasured,true);
  assert.ok(policy.promotionRules.blockIf.includes('cost_regression_without_outcome_gain'));
  assert.match(agents,/powerhouse\|resource-sustainability-governor\|v1/);
  assert.match(agents,/powerhouse-resource-sustainability\/SKILL\.md/);
  assert.match(skill,/reuse -> cache\/readback -> dedupe -> batch/);
});
