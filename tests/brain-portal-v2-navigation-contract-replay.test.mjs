import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Portal V2 canonical hub and navigation recovery remains projected', async () => {
  const hubs = await readFile('portal-v2/hubs.js','utf8');
  const nav = await readFile('portal-v2/navigation-model.js','utf8');
  assert.match(hubs,/DESKTOP_NAV_GROUPS/);
  assert.match(hubs,/allPageIds\(\)/);
  assert.match(hubs,/data-ai/);
  assert.match(hubs,/tasks/);
  assert.match(nav,/export const DESKTOP_NAV_GROUPS/);
});
