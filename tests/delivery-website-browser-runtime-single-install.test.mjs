import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/lane-website.yml', 'utf8');

/**
 * De bedoeling: de website-lane installeert de browser precies één keer per
 * release candidate, en er sluipt geen tweede installatie via Python naast.
 *
 * Deze test telde eerst de letterlijke regels `npm install --no-save
 * playwright@1.55.0` en `npx playwright install --with-deps chromium`. Toen die
 * twee regels werden vervangen door het gedeelde tools/ci/install-chromium.sh
 * ging de test rood terwijl er niets was veranderd aan wat hij bewaakt. Hij telt
 * nu installatiestappen, ongeacht hoe ze geschreven zijn.
 */
test('website lane installs exactly one Playwright/Chromium browser runtime per release candidate', () => {
  const nodeInstalls = workflow.match(/(?:npx playwright install --with-deps|bash tools\/ci\/install-chromium\.sh)/g) || [];
  const pythonPlaywrightInstalls = workflow.match(/python -m pip install playwright|pip install --quiet playwright/g) || [];
  const pythonBrowserInstalls = workflow.match(/python -m playwright install/g) || [];
  assert.equal(nodeInstalls.length, 1, `expected exactly one browser runtime install, found ${nodeInstalls.length}`);
  assert.equal(pythonPlaywrightInstalls.length, 0, `expected no duplicate Python Playwright install, found ${pythonPlaywrightInstalls.length}`);
  assert.equal(pythonBrowserInstalls.length, 0, `expected no duplicate Python Chromium install, found ${pythonBrowserInstalls.length}`);
});

test('de gedeelde installatie schakelt de flakey Google Chrome apt-bron uit', () => {
  const script = readFileSync('tools/ci/install-chromium.sh', 'utf8');
  assert.match(script, /google-chrome/, 'de apt-bron van Google Chrome wordt niet verwijderd');
  assert.match(script, /POGINGEN/, 'er wordt niet opnieuw geprobeerd bij een mislukte installatie');
});

test('single browser job retains targeted, visibility, and high-risk broad exact-preview contracts', () => {
  const browserStart = workflow.indexOf('\n  browser:');
  assert.notEqual(browserStart, -1);
  const browser = workflow.slice(browserStart);
  assert.match(browser, /needs:\s*\[classify, syntax-preflight, preview-ready\]/);
  assert.match(browser, /name: Verify affected routes on desktop and mobile/);
  assert.match(browser, /name: Verify all public pages are visibly rendered/);
  assert.match(browser, /Verify broad high-risk browser contracts/);
  assert.match(browser, /deploy-preview-\$\{\{ inputs\.pr_number \}\}--bedrijfsgeheugen\.netlify\.app/);
  assert.match(browser, /needs\.classify\.outputs\.risk_lane/);
});

test('page-seo only builds the exact artifact and never starts legacy duplicate checkers', () => {
  const pageSeoStart = workflow.indexOf('\n  page-seo:');
  const browserStart = workflow.indexOf('\n  browser:', pageSeoStart);
  assert.notEqual(pageSeoStart, -1);
  assert.notEqual(browserStart, -1);
  const pageSeo = workflow.slice(pageSeoStart, browserStart);
  assert.match(pageSeo, /needs:\s*\[classify, syntax-preflight\]/);
  assert.match(pageSeo, /name: Build and verify exact Netlify website artifact/);
  assert.doesNotMatch(pageSeo, /playwright|PAGINA_BASE_URL|paginacontrole\.py|seocontrole\.py/);
});
