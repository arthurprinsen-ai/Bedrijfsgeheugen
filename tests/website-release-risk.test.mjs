import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteRelease, releaseConcurrencyKey } from '../tools/website-release-risk.mjs';

const riskConfig = JSON.parse(await readFile('config/website-release-risk.json', 'utf8'));
const acceptedBaseline = JSON.parse(await readFile('site/accepted-baseline.json', 'utf8'));

test('one explicitly owned page-local asset is fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/pages/ai-act/local-fix.css'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'fast-fix');
  assert.deepEqual(result.affected_routes, ['/ai-act']);
  assert.equal(result.escalated, false);
  assert.deepEqual(result.required_test_sets, ['baseline','static','preview','targeted-browser']);
});

test('root public HTML change is normal unless explicitly proven local', () => {
  const result = classifyWebsiteRelease({ changedPaths:['ai-automatisering-mkb.html'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'normal');
  assert.ok(result.affected_routes.includes('/ai-automatisering-mkb'));
});

test('shared navigation change is high-risk', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/js/menu.js'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'high-risk');
  assert.equal(result.escalated, true);
});

test('workflow and Netlify config always escalate', () => {
  for (const path of ['.github/workflows/live-preview-smoke.yml','netlify.toml','_redirects']) {
    assert.equal(classifyWebsiteRelease({ changedPaths:[path], riskConfig, acceptedBaseline }).lane, 'high-risk');
  }
});

test('unknown path cannot become fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/future/unknown.css'], riskConfig, acceptedBaseline });
  assert.notEqual(result.lane, 'fast-fix');
  assert.equal(result.escalated, true);
});

test('different PRs get different validation concurrency groups', () => {
  assert.equal(releaseConcurrencyKey({workflow:'release-gate', prNumber:1089}), 'release-gate-pr-1089');
  assert.equal(releaseConcurrencyKey({workflow:'release-gate', prNumber:1090}), 'release-gate-pr-1090');
});
