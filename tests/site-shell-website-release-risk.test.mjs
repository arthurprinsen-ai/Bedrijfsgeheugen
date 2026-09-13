import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteRelease } from '../tools/site-shell/website-release-risk.mjs';

const riskConfig = JSON.parse(await readFile('site/website-release-risk.json', 'utf8'));
const acceptedBaseline = JSON.parse(await readFile('site/accepted-baseline.json', 'utf8'));

test('one explicitly owned page-local asset is fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/pages/ai-act/local-fix.css'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'fast-fix');
  assert.deepEqual(result.affected_routes, ['/ai-act']);
  assert.ok(result.required_test_sets.includes('public-visibility'));
});

test('root public HTML change is normal', () => {
  const result = classifyWebsiteRelease({ changedPaths:['ai-automatisering-mkb.html'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'normal');
  assert.ok(result.affected_routes.includes('/ai-automatisering-mkb'));
});

test('shared navigation and workflow changes are high-risk', () => {
  for (const path of ['assets/js/menu.js','.github/workflows/required-test.yml','netlify.toml']) {
    assert.equal(classifyWebsiteRelease({ changedPaths:[path], riskConfig, acceptedBaseline }).lane, 'high-risk');
  }
});

test('unknown path cannot become fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/future/unknown.css'], riskConfig, acceptedBaseline });
  assert.notEqual(result.lane, 'fast-fix');
  assert.equal(result.escalated, true);
});
