import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('standalone visibility gate bounds every async layer', async () => {
  const source = await readFile('tools/site-shell/standalone-visibility-check.mjs', 'utf8');
  assert.match(source, /UI_VR_NAVIGATION_TIMEOUT_MS/);
  assert.match(source, /UI_VR_FONT_READY_TIMEOUT_MS/);
  assert.match(source, /UI_VR_TOTAL_BUDGET_MS/);
  assert.match(source, /Promise\.race\(\[/);
  assert.match(source, /document\.fonts\.ready/);
  assert.match(source, /AbortSignal\.timeout\(navigationTimeoutMs\)/);
  assert.match(source, /Visibility sweep exceeded bounded budget/);
  assert.match(source, /UI_VR_ROUTE_CONCURRENCY/);
  assert.match(source, /const workerCount = Math\.min\(routeConcurrency, routes\.length\)/);
  assert.match(source, /Promise\.all\(Array\.from\(\{ length: workerCount \}/);
  assert.doesNotMatch(source, /for \(let attempt = 1; attempt <= 4; attempt\+\+\)/);
});


test('website release-risk regression follows bounded route concurrency instead of obsolete sequential route loop', async () => {
  const regression = await readFile('tests/site-shell-website-release-risk.test.mjs', 'utf8');
  assert.match(regression, /UI_VR_ROUTE_CONCURRENCY/);
  assert.match(regression, /workerCount/);
  assert.match(regression, /routeIndex/);
});
