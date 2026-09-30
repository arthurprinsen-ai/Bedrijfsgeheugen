import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('product-led production promotion keeps canonical build and redeploy heartbeat', async () => {
  const toml = await readFile('netlify.toml','utf8');
  assert.match(toml,/node tools\/site-shell\/apply-product-led-home\.mjs/);
  assert.match(toml,/production redeploy heartbeat: product-led-home-live-20260930-v1/);
});
