import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/lane-website.yml',import.meta.url),'utf8');

test('required website browser gate uses one real official Playwright container and no apt-install loop',()=>{
  assert.match(workflow,/image: mcr\\.microsoft\\.com\\/playwright:v1\\.61\\.0-noble/);
  assert.match(workflow,/npm install --no-save --package-lock=false --ignore-scripts playwright@1\\.61\\.0/);
  assert.match(workflow,/name: Verify prebuilt shared website browser runtime/);
  assert.match(workflow,/BROWSER_BINARY_MISSING:chromium/);
  assert.match(workflow,/await chromium\\.launch/);
  assert.doesNotMatch(workflow,/bash tools\\/ci\\/install-chromium.sh/);
  assert.doesNotMatch(workflow,/npx playwright install --with-deps/);
});

test('the browser gate is mandatory, never a forced success or skipped step',()=>{
  const idx=workflow.indexOf('name: Verify prebuilt shared website browser runtime');
  assert.ok(idx>=0);
  const window=workflow.slice(idx,idx+440);
  assert.ok(!window.includes('continue-on-error: true'));
  assert.ok(!window.includes('|| true'));
});
