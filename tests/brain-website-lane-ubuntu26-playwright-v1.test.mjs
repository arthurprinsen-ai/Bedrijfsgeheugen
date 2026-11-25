import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/lane-website.yml',import.meta.url),'utf8');

test('required website browser gate uses one real official Playwright container and no apt-install loop',()=>{
  assert.ok(workflow.includes('image: mcr.microsoft.com/playwright:v1.61.0-noble'));
  assert.ok(workflow.includes('npm install --no-save --package-lock=false --ignore-scripts playwright@1.61.0'));
  assert.ok(workflow.includes('name: Verify prebuilt shared website browser runtime'));
  assert.ok(workflow.includes('BROWSER_BINARY_MISSING:chromium'));
  assert.ok(workflow.includes('await chromium.launch'));
  assert.ok(!workflow.includes('bash tools/ci/install-chromium.sh'));
  assert.ok(!workflow.includes('npx playwright install --with-deps'));
});

test('the browser gate is mandatory, never a forced success or skipped step',()=>{
  const idx=workflow.indexOf('name: Verify prebuilt shared website browser runtime');
  assert.ok(idx>=0);
  const window=workflow.slice(idx,idx+440);
  assert.ok(!window.includes('continue-on-error: true'));
  assert.ok(!window.includes('|| true'));
});
