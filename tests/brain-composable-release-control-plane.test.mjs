import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const required = readFileSync('.github/workflows/required-test.yml', 'utf8');

for (const file of ['lane-website.yml','lane-portal.yml','lane-backend.yml','lane-automation.yml']) {
  test(`reusable release lane exists: ${file}`, () => {
    assert.equal(existsSync(`.github/workflows/${file}`), true, `${file} must exist`);
  });
}

test('required test is a stable aggregator and preserves the protected test context', () => {
  assert.match(required, /name:\s*Required test/);
  assert.match(required, /name:\s*test/);
  assert.match(required, /moving-main-successor-guard\.mjs/);
  for (const lane of ['website','portal','backend','automation']) {
    assert.match(required, new RegExp(`uses:\\s*\\./\\.github/workflows/lane-${lane}\\.yml`));
  }
  assert.doesNotMatch(required, /v18-vergelijker\.test\.mjs/);
  assert.doesNotMatch(required, /tests\/portal-\*\.test\.mjs/);
  assert.doesNotMatch(required, /make-cost-governor-policy\.test\.mjs/);
});

test('website lane keeps public visibility mandatory while broad checks are high-risk only', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  assert.match(website, /classifyWebsiteRelease/);
  assert.match(website, /\n  browser:/);
  const visibilityStart = website.indexOf('      - name: Verify all public pages are visibly rendered');
  assert.notEqual(visibilityStart, -1);
  const broadStart = website.indexOf('      - name: Verify broad high-risk browser contracts', visibilityStart);
  assert.notEqual(broadStart, -1);
  const visibility = website.slice(visibilityStart, broadStart);
  assert.doesNotMatch(visibility, /if:.*(?:high-risk|fast-fix|normal)|risk_lane/);
  const broad = website.slice(broadStart);
  assert.match(broad, /if:\s*needs\.classify\.outputs\.risk_lane == 'high-risk'/);
  assert.match(website, /verify-targeted-website-routes\.mjs/);
});

test('page and SEO contracts run against built and materialized canonical output', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const pageSeoStart = website.indexOf('\n  page-seo:');
  const previewStart = website.indexOf('\n  preview-ready:', pageSeoStart);
  assert.notEqual(pageSeoStart, -1);
  assert.notEqual(previewStart, -1);
  const pageSeo = website.slice(pageSeoStart, previewStart);
  assert.match(pageSeo, /name: Build canonical SEO input/);
  for (const command of [
    'node tools/bouw-v18-production-core.mjs',
    'node tools/apply-v18-seo.mjs',
    'node tools/bouw-losse-paginas.mjs',
    'node tools/bouw-inhoudspaginas.mjs',
    'node tools/bouw-v18-views.mjs',
    'node tools/normaliseer-site-ui.mjs',
  ]) assert.match(pageSeo, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(
    pageSeo.indexOf('node tools/bouw-v18-views.mjs') < pageSeo.indexOf('node tools/normaliseer-site-ui.mjs'),
    'standalone V18 views such as over-ons must exist before canonical output materialization',
  );
  assert.ok(
    pageSeo.indexOf('node tools/normaliseer-site-ui.mjs') < pageSeo.indexOf('name: Verify page and SEO contracts'),
    'canonical output must be materialized before page/SEO verification',
  );
});

test('production readback is serialized and never cancelled mid-flight', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(required, /concurrency:[\s\S]*production-release-readback/);
});
