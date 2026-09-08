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

test('page and SEO contracts use the same artifact-producing build chain as Netlify', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const pageSeoStart = website.indexOf('\n  page-seo:');
  const previewStart = website.indexOf('\n  preview-ready:', pageSeoStart);
  assert.notEqual(pageSeoStart, -1);
  assert.notEqual(previewStart, -1);
  const pageSeo = website.slice(pageSeoStart, previewStart);
  assert.match(pageSeo, /name: Build exact Netlify website artifact/);
  const commands = [
    'node tools/bouw-powerhouse-auth.mjs',
    'node tools/bouw-kennisindex.mjs',
    'node tools/bouw-v18-production.mjs',
    'node tools/apply-tabbladen.mjs',
    'node tools/bouw-v18-views.mjs',
    'node tools/bouw-v18-chrome-alles.mjs',
    'node tools/prijzen-uit-de-homepage.mjs',
  ];
  for (const command of commands) {
    assert.match(pageSeo, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (let index = 1; index < commands.length; index += 1) {
    assert.ok(
      pageSeo.indexOf(commands[index - 1]) < pageSeo.indexOf(commands[index]),
      `Netlify build order must preserve ${commands[index - 1]} before ${commands[index]}`,
    );
  }
  assert.doesNotMatch(pageSeo, /node tools\/normaliseer-site-ui\.mjs/, 'page-seo must not invent a second local build composition');
  assert.ok(
    pageSeo.indexOf('node tools/prijzen-uit-de-homepage.mjs') < pageSeo.indexOf('name: Verify page and SEO contracts'),
    'page and SEO checks must run only after the Netlify artifact-producing build chain',
  );
});

test('production readback is serialized and never cancelled mid-flight', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(required, /concurrency:[\s\S]*production-release-readback/);
});
