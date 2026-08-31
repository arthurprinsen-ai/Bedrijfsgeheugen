import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appUrl = new URL('../portal/app.mjs', import.meta.url);

test('authenticated portal treats canonical server state as authoritative regardless of local timestamp', async () => {
  const app = await readFile(appUrl, 'utf8');
  assert.equal(app.includes('timestamp(server)>=timestamp(local)'), false, 'local timestamp must never outrank canonical server state');
  assert.ok(app.includes("serverResult.status==='found'"), 'canonical found state must be handled explicitly');
});

test('local legacy state seeds canonical storage only after an authoritative 404 and never after read failure', async () => {
  const app = await readFile(appUrl, 'utf8');
  assert.ok(app.includes("status:'missing'"), '404 must be distinguished from an unavailable server read');
  assert.ok(app.includes("status:'unavailable'"), 'network/auth/provider failures must remain unavailable, not absent');
  assert.ok(app.includes("serverResult.status==='missing'&&local"), 'local migration may write only when canonical state is proven absent');
  assert.ok(app.includes("serverResult.status==='unavailable'"), 'unavailable canonical state must have an explicit fail-closed branch');
});
