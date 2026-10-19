import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/lane-website.yml',import.meta.url),'utf8');

test('required website browser gate uses Playwright with Ubuntu 26.04 support',()=>{
  assert.ok(workflow.includes('PLAYWRIGHT_PACKAGE=playwright@1.61.0 bash tools/ci/install-chromium.sh'));
  assert.ok(!workflow.includes('PLAYWRIGHT_PACKAGE=playwright@1.55.0'));
  assert.match(workflow,/name: Install shared website browser runtime/);
  assert.match(workflow,/bash tools\/ci\/install-chromium.sh/);
});

test('the browser gate is mandatory, never a forced success or skipped step',()=>{
  const idx=workflow.indexOf('name: Install shared website browser runtime');
  assert.ok(idx>=0);
  const window=workflow.slice(idx,idx+440);
  assert.ok(!window.includes('continue-on-error: true'));
  assert.ok(!window.includes('|| true'));
});
