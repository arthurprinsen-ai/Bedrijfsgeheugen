import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteRelease } from '../tools/site-shell/website-release-risk.mjs';

const riskConfig = JSON.parse(await readFile('site/website-release-risk.json', 'utf8'));
const acceptedBaseline = JSON.parse(await readFile('site/accepted-baseline.json', 'utf8'));
const websiteLane = await readFile('.github/workflows/lane-website.yml', 'utf8');

test('one explicitly owned page-local asset is fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/pages/ai-act/local-fix.css'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'fast-fix');
  assert.deepEqual(result.affected_routes, ['/ai-act']);
  assert.equal(result.requires_preview, true);
  assert.ok(result.required_test_sets.includes('public-visibility'));
});

test('root public HTML change is normal', () => {
  const result = classifyWebsiteRelease({ changedPaths:['ai-automatisering-mkb.html'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'normal');
  assert.equal(result.requires_preview, true);
  assert.ok(result.affected_routes.includes('/ai-automatisering-mkb'));
});

test('shared navigation and website delivery workflow changes are high-risk', () => {
  for (const path of ['assets/js/menu.js','.github/workflows/required-test.yml','netlify.toml']) {
    const result = classifyWebsiteRelease({ changedPaths:[path], riskConfig, acceptedBaseline });
    assert.equal(result.lane, 'high-risk');
    assert.equal(result.requires_preview, true);
  }
});

test('approved blog and delivery-control-plane-only changes do not require a website deploy preview', () => {
  const result = classifyWebsiteRelease({
    changedPaths:[
      '.github/workflows/approved-central-blog.yml',
      'docs/growth-revenue-os-architecture.md',
      'tests/brain-change-scoped-release-lanes.test.mjs',
      'tools/brain-delivery-system.mjs'
    ],
    riskConfig,
    acceptedBaseline
  });
  assert.equal(result.lane, 'control-plane');
  assert.equal(result.requires_preview, false);
  assert.deepEqual(result.affected_routes, []);
});

test('a real website artifact mixed with control-plane changes still requires preview', () => {
  const result = classifyWebsiteRelease({
    changedPaths:['docs/growth-revenue-os-architecture.md','index.html'],
    riskConfig,
    acceptedBaseline
  });
  assert.equal(result.lane, 'normal');
  assert.equal(result.requires_preview, true);
  assert.ok(result.affected_routes.includes('/'));
});

test('unknown path cannot become fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/future/unknown.css'], riskConfig, acceptedBaseline });
  assert.notEqual(result.lane, 'fast-fix');
  assert.equal(result.escalated, true);
  assert.equal(result.requires_preview, true);
});

test('website browser verification stays exact-candidate and preserves scoped clean-URL fallback', () => {
  assert.match(websiteLane, /requires_preview: \$\{\{ steps\.risk\.outputs\.requires_preview \}\}/);
  assert.match(websiteLane, /if: needs\.classify\.outputs\.requires_preview == 'true'/);
  assert.match(websiteLane, /preview_mode/);
  assert.match(websiteLane, /local-exact-candidate/);
  assert.match(websiteLane, /python3 tools\/ci\/serve-clean-urls\.py --port 4173 --bind 127\.0\.0\.1/);
  assert.match(websiteLane, /http:\/\/127\.0\.0\.1:4173/);
  assert.match(websiteLane, /BASE_URL: \$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(websiteLane, /UI_VR_BASE_URL: \$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(websiteLane, /ref:\s*\$\{\{ inputs\.candidate_sha \}\}/);
});
