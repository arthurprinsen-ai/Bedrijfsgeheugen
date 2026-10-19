import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/canonical-brand-shell-live-readback.yml', import.meta.url), 'utf8');

test('production visual acceptance uses Playwright-supported pinned runner and remains mandatory', () => {
  const job = workflow.match(/  production-readback:\n([\s\S]*?)(?=\n  [a-z][a-z0-9_-]*:\n|$)/)?.[1];
  assert.ok(job, 'missing production-readback job');
  assert.match(job, /runs-on: ubuntu-24\.04/);
  assert.match(job, /PLAYWRIGHT_PACKAGE=playwright@1\.55\.0 bash tools\/ci\/install-chromium\.sh/);
  assert.match(job, /Verify every public production page is visibly rendered/);
  assert.match(job, /Production UI visual regression readback/);
  assert.doesNotMatch(job, /continue-on-error:\s*true/);
  assert.doesNotMatch(job, /if:\s*false/);
});
