import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const policy = JSON.parse(fs.readFileSync('config/content-growth-policy.json','utf8'));
test('commercial hierarchy is stronger than engagement hierarchy', () => {
  assert.ok(policy.weights.order > policy.weights.qualified_lead);
  assert.ok(policy.weights.qualified_lead > policy.weights.lead);
  assert.ok(policy.weights.lead > policy.weights.cta);
  assert.ok(policy.weights.cta > policy.weights.click);
  assert.ok(policy.weights.click > policy.weights.engagement);
  assert.ok(policy.weights.engagement > policy.weights.reach);
  assert.equal(policy.explorationRatio, 0.2);
  assert.equal(policy.timeZone, 'Europe/Amsterdam');
});
