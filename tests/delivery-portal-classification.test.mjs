import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('portal regression tests are owned by the portal delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const portal = policy.lanes.find(lane => lane.id === 'portal');
  const path = 'tests/portal-data-adapter.test.mjs';
  assert.ok(portal, 'portal delivery lane must exist');
  assert.equal(portal.paths.some(pattern => pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern || path.startsWith(pattern)), true);
});
