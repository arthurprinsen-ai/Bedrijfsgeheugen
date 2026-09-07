import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/release-gate.yml','utf8');

test('release gate has stable identity and PR isolated concurrency', () => {
  assert.match(workflow, /name:\s*Release Gate/);
  assert.match(workflow, /name:\s*release-gate/);
  assert.match(workflow, /release-gate-pr-/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
});

test('release gate classifies risk and verifies targeted preview routes', () => {
  assert.match(workflow, /website-release-risk\.mjs/);
  assert.match(workflow, /verify-targeted-website-routes\.mjs/);
  assert.match(workflow, /netlify\/bedrijfsgeheugen\/deploy-preview/);
  assert.match(workflow, /site-baseline-guardian\.test\.mjs/);
});

test('broad page SEO and full regression are conditional on selected risk depth', () => {
  assert.match(workflow, /contains\(needs\.classify\.outputs\.required, 'page-seo'\)/);
  assert.match(workflow, /contains\(needs\.classify\.outputs\.required, 'full-regression'\)/);
});
