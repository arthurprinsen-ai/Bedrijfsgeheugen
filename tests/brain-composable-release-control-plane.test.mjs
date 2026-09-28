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
  assert.match(website, /\n  netlify-build-parity:\n\s+needs:\s*\[classify, syntax-preflight\]/);
  assert.match(website, /\n  browser:\n\s+needs:\s*\[classify, syntax-preflight, preview-ready, netlify-build-parity\]/);
  assert.doesNotMatch(website, /\n  page-seo:/);
});

test('one exact artifact build owns SEO validation and browser reuses exact preview with local fallback', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const previewReadyStart = website.indexOf('\n  preview-ready:');
  const buildStart = website.indexOf('\n  netlify-build-parity:', previewReadyStart);
  const browserStart = website.indexOf('\n  browser:', buildStart);
  assert.notEqual(previewReadyStart, -1);
  assert.notEqual(buildStart, -1);
  assert.notEqual(browserStart, -1);
  const previewReady = website.slice(previewReadyStart, buildStart);
  const artifactBuild = website.slice(buildStart, browserStart);
  const browser = website.slice(browserStart);

  assert.match(artifactBuild, /needs:\s*\[classify, syntax-preflight\]/);
  assert.match(artifactBuild, /name: Install exact Netlify build dependencies/);
  assert.match(artifactBuild, /run: npm install --prefer-offline/);
  assert.match(artifactBuild, /name: Run exact Netlify production build command/);
  assert.match(artifactBuild, /name: Verify built artifact contracts/);
  for (const command of ['node tools/bouw-powerhouse-auth.mjs','node tools/bouw-kennisindex.mjs','node tools/bouw-v18-production.mjs','node tools/apply-tabbladen.mjs','node tools/bouw-v18-views.mjs','node tools/bouw-v18-chrome-alles.mjs','node tools/prijzen-uit-de-homepage.mjs']) {
    assert.ok(artifactBuild.includes(command), `missing build command: ${command}`);
  }

  assert.match(previewReady, /HEAD_SHA:\s*\$\{\{ inputs\.change_head_sha \}\}/);
  assert.match(previewReady, /netlify\/bedrijfsgeheugen\/deploy-preview/);
  assert.match(previewReady, /preview_mode=local-exact-candidate/);
  assert.match(browser, /needs:\s*\[classify, syntax-preflight, preview-ready, netlify-build-parity\]/);
  assert.match(browser, /BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /name: Build and serve exact local candidate only when Netlify preview is unavailable/);
  assert.match(browser, /if:\s*needs\.preview-ready\.outputs\.preview_mode == 'local-exact-candidate'/);
  assert.match(browser, /UI_VR_BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.doesNotMatch(website, /\n  page-seo:/);
});

test('Netlify preview failure falls through to exact local candidate verification', () => {
  const website = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  const previewReadyStart = website.indexOf('\n  preview-ready:');
  const buildStart = website.indexOf('\n  netlify-build-parity:', previewReadyStart);
  assert.notEqual(previewReadyStart, -1);
  assert.notEqual(buildStart, -1);
  const previewReady = website.slice(previewReadyStart, buildStart);
  assert.match(previewReady, /\['failure','error'\]\.includes\(status\?\.state\)/);
  assert.doesNotMatch(previewReady, /\['failure','error'\]\.includes\(status\?\.state\)\) throw new Error/);
  assert.match(previewReady, /Netlify preview .*exact local candidate fallback/);
  assert.match(previewReady, /preview_mode=local-exact-candidate/);
  assert.match(website, /if:\s*needs\.preview-ready\.outputs\.preview_mode == 'local-exact-candidate'/);
});
test('production readback is single-flight and supersedes obsolete main readbacks', () => {
  const production = readFileSync('.github/workflows/production-release-readback.yml', 'utf8');
  assert.match(production, /group:\s*production-release-readback\s*$/m);
  assert.match(production, /cancel-in-progress:\s*true/);
  const concurrencyStart = required.indexOf('\nconcurrency:');
  const jobsStart = required.indexOf('\njobs:', concurrencyStart);
  assert.notEqual(concurrencyStart, -1, 'Required test concurrency block must exist');
  assert.notEqual(jobsStart, -1, 'Required test jobs block must follow concurrency');
  const requiredConcurrency = required.slice(concurrencyStart, jobsStart);
  assert.doesNotMatch(requiredConcurrency, /production-release-readback/);
});
