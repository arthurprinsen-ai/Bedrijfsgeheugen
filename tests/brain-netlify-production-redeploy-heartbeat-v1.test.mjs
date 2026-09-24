import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Netlify production heartbeat remains behavior-neutral',()=>{
  const config=fs.readFileSync('netlify.toml','utf8');
  assert.match(config,/production redeploy heartbeat: pricing-i18n-live-20260924-v1/);
  assert.doesNotMatch(config,/^\s*ignore\s*=/m);
});
