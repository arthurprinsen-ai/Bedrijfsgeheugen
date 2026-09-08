import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/lane-website.yml', 'utf8');

test('website lane installs exactly one Playwright/Chromium browser runtime per release candidate', () => {
  const npmInstalls = workflow.match(/npm install --no-save playwright@1\.55\.0/g) || [];
  const nodeBrowserInstalls = workflow.match(/npx playwright install --with-deps chromium/g) || [];
  const pythonPlaywrightInstalls = workflow.match(/python -m pip install playwright/g) || [];
  const pythonBrowserInstalls = workflow.match(/python -m playwright install/g) || [];
  assert.equal(npmInstalls.length, 1, `expected one Node Playwright install, found ${npmInstalls.length}`);
  assert.equal(nodeBrowserInstalls.length, 1, `expected one Node Chromium install, found ${nodeBrowserInstalls.length}`);
  assert.equal(pythonPlaywrightInstalls.length, 0, `expected no duplicate Python Playwright install, found ${pythonPlaywrightInstalls.length}`);
  assert.equal(pythonBrowserInstalls.length, 0, `expected no duplicate Python Chromium install, found ${pythonBrowserInstalls.length}`);
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
