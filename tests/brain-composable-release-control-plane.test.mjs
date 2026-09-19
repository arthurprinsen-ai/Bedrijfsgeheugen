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
  assert.match(required, /delivery-driftless-merge-candidate\.test\.mjs/);
  assert.match(required, /change_head_sha/);
  assert.match(required, /candidate_sha/);
  assert.doesNotMatch(required, /moving-main-successor-guard\.mjs/);
  assert.doesNotMatch(required, /Block unjustified moving-main successor rebuilds/);
  for (const lane of ['website','portal','backend','automation']) {
    assert.match(required, new RegExp(`uses:\\s*\\./\\.github/workflows/lane-${lane}\\.yml`));
  }
  assert.doesNotMatch(required, /v18-vergelijker\.test\.mjs/);
  assert.doesNotMatch(required, /tests\/portal-\*\.test\.mjs/);
  assert.doesNotMatch(required, /make-cost-governor-policy\.test\.mjs/);
});

test('website lane keeps targeted proof for normal changes and broad visibility for high-risk changes', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  assert.match(website, /classifyWebsiteRelease/);
  assert.match(website, /\n  browser:/);
  assert.match(website, /verify-targeted-website-routes\.mjs/);
  const visibilityStart = website.indexOf('      - name: Verify all public pages are visibly rendered');
  assert.notEqual(visibilityStart, -1);
  const broadStart = website.indexOf('      - name: Verify broad high-risk browser contracts', visibilityStart);
  assert.notEqual(broadStart, -1);
  const visibility = website.slice(visibilityStart, broadStart);
  assert.match(visibility, /if:\s*needs\.classify\.outputs\.risk_lane == 'high-risk'/);
  const broad = website.slice(broadStart);
  assert.match(broad, /if:\s*needs\.classify\.outputs\.risk_lane == 'high-risk'/);
});

test('static syntax preflight blocks preview, artifact build and browser execution', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  assert.match(website, /\n  syntax-preflight:[\s\S]*Fail fast on broken inline JavaScript[\s\S]*website-static-syntax-preflight\.mjs/);
  assert.match(website, /\n  preview-ready:\n\s+needs:\s*\[classify, syntax-preflight\]/);
  assert.match(website, /\n  page-seo:\n\s+needs:\s*\[classify, syntax-preflight\]/);
  assert.match(website, /\n  browser:\n\s+needs:\s*\[classify, syntax-preflight, preview-ready\]/);
});

test('exact artifact build owns modern SEO validation while browser consumes the exact candidate resolved by preview-ready', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const previewReadyStart = website.indexOf('\n  preview-ready:');
  const pageSeoStart = website.indexOf('\n  page-seo:', previewReadyStart);
  const browserStart = website.indexOf('\n  browser:', pageSeoStart);
  assert.notEqual(previewReadyStart, -1);
  assert.notEqual(pageSeoStart, -1);
  assert.notEqual(browserStart, -1);
  const previewReady = website.slice(previewReadyStart, pageSeoStart);
  const pageSeo = website.slice(pageSeoStart, browserStart);
  const browser = website.slice(browserStart);

  assert.match(pageSeo, /needs:\s*\[classify, syntax-preflight\]/);
  assert.match(pageSeo, /name: Install Netlify build dependencies/);
  assert.match(pageSeo, /run: npm install/);
  assert.match(pageSeo, /name: Build and verify exact Netlify website artifact/);
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
  assert.doesNotMatch(pageSeo, /normaliseer-site-ui\.mjs|seocontrole\.py|paginacontrole\.py|playwright|PAGINA_BASE_URL/);

  assert.match(previewReady, /HEAD_SHA:\s*\$\{\{ inputs\.change_head_sha \}\}/);
  assert.match(previewReady, /netlify\/bedrijfsgeheugen\/deploy-preview/);
  assert.match(previewReady, /deploy-preview-\$\{process\.env\.PR_NUMBER\}--bedrijfsgeheugen\.netlify\.app/);
  assert.match(previewReady, /preview_mode=local-exact-candidate/);
  assert.match(previewReady, /base_url=http:\/\/127\.0\.0\.1:4173/);

  assert.match(browser, /needs:\s*\[classify, syntax-preflight, preview-ready\]/);
  assert.match(browser, /BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /UI_VR_BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /needs\.preview-ready\.outputs\.preview_mode == 'local-exact-candidate'/);
  assert.doesNotMatch(browser, /https:\/\/deploy-preview-\$\{\{ inputs\.pr_number \}\}--bedrijfsgeheugen\.netlify\.app/);
});

test('Netlify preview failure falls through to exact local candidate verification', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const previewReadyStart = website.indexOf('\n  preview-ready:');
  const pageSeoStart = website.indexOf('\n  page-seo:', previewReadyStart);
  assert.notEqual(previewReadyStart, -1);
  assert.notEqual(pageSeoStart, -1);
  const previewReady = website.slice(previewReadyStart, pageSeoStart);
  assert.match(previewReady, /\['failure','error'\]\.includes\(status\?\.state\)/);
  assert.doesNotMatch(previewReady, /\['failure','error'\]\.includes\(status\?\.state\)\) throw new Error/);
  assert.match(previewReady, /Netlify preview .*exact local candidate fallback/);
  assert.match(previewReady, /preview_mode=local-exact-candidate/);
});

test('production readback is serialized and never cancelled mid-flight', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*false/);
  const concurrencyStart = required.indexOf('\nconcurrency:');
  const jobsStart = required.indexOf('\njobs:', concurrencyStart);
  assert.notEqual(concurrencyStart, -1, 'Required test concurrency block must exist');
  assert.notEqual(jobsStart, -1, 'Required test jobs block must follow concurrency');
  const requiredConcurrency = required.slice(concurrencyStart, jobsStart);
  assert.doesNotMatch(requiredConcurrency, /production-release-readback/);
});
