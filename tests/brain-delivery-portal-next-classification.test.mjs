import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('customer portal v2, portal-next and their browser/contracts stay in the portal delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const paths = [
    'klantenportaal-selftest.html',
    'klantenportaal-test.html',
    'portal-next/index.html',
    'portal-next/portal-next.js',
    'portal-v2/index.html',
    'portal-v2/tests/page-shell.test.mjs',
    'tests/integration/portal-next-live.spec.js',
    'tests/klantportaal-cockpit-contract.test.mjs',
    'tests/klantportaal-v2-pages.test.mjs'
  ];

  for (const path of paths) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'cafe1234deadbeef', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['portal'], `${path} must be portal delivery work`);
  }
});
