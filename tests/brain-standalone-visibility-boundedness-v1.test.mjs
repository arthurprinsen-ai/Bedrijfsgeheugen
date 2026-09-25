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


test('website lane wraps the full visibility sweep in an OS-level hard timeout', async () => {
  const workflow = await readFile('.github/workflows/lane-website.yml', 'utf8');
  assert.match(workflow, /timeout --signal=TERM --kill-after=15s 9m node tools\/site-shell\/standalone-visibility-check\.mjs/);
});


test('Playwright teardown is separately bounded and preserves semantic exit state', async () => {
  const source = await readFile('tools/site-shell/standalone-visibility-check.mjs', 'utf8');
  assert.match(source, /UI_VR_CLEANUP_TIMEOUT_MS/);
  assert.match(source, /async function closeBounded/);
  assert.match(source, /cleanupTimedOut = true/);
  assert.match(source, /closeBounded\(\`context \$\{viewport\.name\}\`/);
  assert.match(source, /closeBounded\('browser'/);
  assert.match(source, /if \(cleanupTimedOut\) process\.exit\(0\)/);
  assert.match(source, /if \(cleanupTimedOut\)[\s\S]*process\.exit\(1\)/);
});


test('visibility sweep parallelizes bounded viewport batches', async () => {
  const source = await readFile('tools/site-shell/standalone-visibility-check.mjs', 'utf8');
  assert.match(source, /UI_VR_VIEWPORT_CONCURRENCY/);
  assert.match(source, /const runViewport = async viewport =>/);
  assert.match(source, /viewports\.slice\(viewportIndex, viewportIndex \+ viewportConcurrency\)\.map\(runViewport\)/);
  assert.match(source, /Promise\.all\(viewports\.slice/);
});


test('visibility route concurrency scales with sitemap size while remaining capped', async () => {
  const source = await readFile('tools/site-shell/standalone-visibility-check.mjs', 'utf8');
  assert.match(source, /configuredRouteConcurrency/);
  assert.match(source, /Math\.ceil\(routes\.length \/ 12\)/);
  assert.match(source, /Math\.min\(8,/);
  assert.match(source, /configuredRouteConcurrency > 0 \? configuredRouteConcurrency/);
});
