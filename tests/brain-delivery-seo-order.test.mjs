import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createDeliveryPlan, deriveConflictContracts } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));
const headSha = '0123456789abcdef0123456789abcdef01234567';

const seoPaths = [
  'tools/seo-order-engine/apply.mjs',
  'site/seo-order-map.json',
  'tests/seo-order-registry.test.mjs',
  '.github/workflows/seo-order-engine.yml',
  '.github/workflows/canonical-brand-shell-full-build.yml',
  '.github/workflows/canonical-brand-shell-live-readback.yml',
  'tools/prijzen-uit-de-homepage.mjs'
];

test('SEO order engine changes are owned by the website delivery lane', () => {
  const plan = createDeliveryPlan({ changedPaths: seoPaths, headSha, policy });
  assert.ok(plan.lanes.some(lane => lane.id === 'website'));
  assert.ok(!plan.lanes.some(lane => lane.id === 'backend'), 'SEO order engine itself is not a backend lane');
});

test('SEO order engine files share one declared conflict contract', () => {
  const contracts = deriveConflictContracts(seoPaths, policy);
  assert.ok(contracts.includes('seo-order-engine'), `contracts: ${contracts.join(', ')}`);
});
