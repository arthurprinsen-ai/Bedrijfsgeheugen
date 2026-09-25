import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/lane-website.yml','utf8');

test('broad browser proof uses exact local candidate while targeted routes may use route-ready preview', () => {
  const browserStart = workflow.indexOf('\n  browser:');
  assert.notEqual(browserStart, -1);
  const browser = workflow.slice(browserStart);

  assert.match(browser, /name: Verify affected routes on desktop and mobile[\s\S]*BASE_URL:\s*\$\{\{ needs\.preview-ready\.outputs\.base_url \}\}/);
  assert.match(browser, /name: Build and serve exact local candidate for broad browser checks/);
  assert.match(browser, /name: Verify all public pages are visibly rendered[\s\S]*UI_VR_BASE_URL:\s*http:\/\/127\.0\.0\.1:4173/);
  assert.match(browser, /name: Verify every header menu panel is readable[\s\S]*UI_VR_BASE_URL:\s*http:\/\/127\.0\.0\.1:4173/);
  assert.match(browser, /name: Verify broad high-risk browser contracts[\s\S]*UI_VR_BASE_URL:\s*http:\/\/127\.0\.0\.1:4173/);
});

test('broad local candidate build is unconditional on Netlify preview mode', () => {
  const browserStart = workflow.indexOf('\n  browser:');
  const browser = workflow.slice(browserStart);
  const buildIndex = browser.indexOf('name: Build and serve exact local candidate for broad browser checks');
  assert.notEqual(buildIndex, -1);
  const nextStep = browser.indexOf('\n      - name:', buildIndex + 10);
  const buildBlock = browser.slice(buildIndex, nextStep === -1 ? browser.length : nextStep);
  assert.doesNotMatch(buildBlock, /preview_mode == 'local-exact-candidate'/);
});
