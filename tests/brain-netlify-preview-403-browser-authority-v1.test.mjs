import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/lane-website.yml','utf8');

test('browser proof uses route-ready preview and falls back to the exact local candidate only when preview is unavailable', () => {
  const browserStart = workflow.indexOf('\n  browser:');
  assert.notEqual(browserStart, -1);
  const browser = workflow.slice(browserStart);

  assert.match(browser, /name: Verify affected routes on desktop and mobile[\s\S]*BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /name: Verify all public pages are visibly rendered[\s\S]*UI_VR_BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /name: Verify every header menu panel is readable[\s\S]*UI_VR_BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /name: Verify broad high-risk browser contracts[\s\S]*UI_VR_BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
});

test('local candidate build is exact-SHA scoped and only runs when Netlify preview is unavailable', () => {
  const browserStart = workflow.indexOf('\n  browser:');
  const browser = workflow.slice(browserStart);
  const buildIndex = browser.indexOf('name: Build and serve exact local candidate only when Netlify preview is unavailable');
  assert.notEqual(buildIndex, -1);
  const nextStep = browser.indexOf('\n      - name:', buildIndex + 10);
  const buildBlock = browser.slice(buildIndex, nextStep === -1 ? browser.length : nextStep);
  assert.match(buildBlock, /preview_mode == 'local-exact-candidate'/);
  assert.match(buildBlock, /COMMIT_REF: \$\{\{ inputs\.candidate_sha \}\}/);
});
