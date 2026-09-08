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

test('page and SEO contracts stay static while exact-preview runtime is owned by the browser lane', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const pageSeoStart = website.indexOf('\n  page-seo:');
  const browserStart = website.indexOf('\n  browser:', pageSeoStart);
  assert.notEqual(pageSeoStart, -1);
  assert.notEqual(browserStart, -1);
  const pageSeo = website.slice(pageSeoStart, browserStart);
  const browser = website.slice(browserStart);

  assert.match(pageSeo, /needs:\s*classify/);
  assert.match(pageSeo, /name: Install Netlify build dependencies/);
  assert.match(pageSeo, /run: npm install/);
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
  assert.ok(
    pageSeo.indexOf('name: Install Netlify build dependencies') < pageSeo.indexOf(commands[0]),
    'Netlify build dependencies must be installed before artifact production',
  );
  for (let index = 1; index < commands.length; index += 1) {
    assert.ok(
      pageSeo.indexOf(commands[index - 1]) < pageSeo.indexOf(commands[index]),
      `Netlify build order must preserve ${commands[index - 1]} before ${commands[index]}`,
    );
  }
  assert.doesNotMatch(pageSeo, /node tools\/normaliseer-site-ui\.mjs/, 'page-seo must not invent a second local build composition');
  assert.match(pageSeo, /python \.github\/scripts\/seocontrole\.py/);
  assert.doesNotMatch(pageSeo, /PAGINA_BASE_URL|paginacontrole\.py|playwright/);
  assert.match(browser, /needs:\s*\[classify, preview-ready\]/);
  assert.match(browser, /deploy-preview-\$\{\{ inputs\.pr_number \}\}--bedrijfsgeheugen\.netlify\.app/);
});

test('production readback is serialized and never cancelled mid-flight', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*false/);
  assert.doesNotMatch(required, /concurrency:[\s\S]*production-release-readback/);
});
