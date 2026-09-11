import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stateClient=readFileSync(new URL('../portal-v2/portal-state.js',import.meta.url),'utf8');

test('Portal V2 installs a hydration guard before customer/demo state is shown',()=>{
  assert.match(stateClient,/v2-hydrating/);
  assert.match(stateClient,/visibility\s*:\s*hidden/);
  assert.match(stateClient,/portalBoot/);
});

test('the hydration guard is released only through a settled state publication',()=>{
  assert.match(stateClient,/releaseBootGuard/);
  assert.match(stateClient,/publish=next=>/);
  assert.match(stateClient,/releaseBootGuard\(\)/);
});
