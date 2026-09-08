import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/lane-website.yml', 'utf8');
const pageCheck = readFileSync('.github/scripts/paginacontrole.py', 'utf8');

test('website lane installs Node Playwright only once per release candidate', () => {
  const npmInstalls = workflow.match(/npm install --no-save playwright@1\.55\.0/g) || [];
  const browserInstalls = workflow.match(/npx playwright install --with-deps chromium/g) || [];
  assert.equal(npmInstalls.length, 1, `expected one Node Playwright install, found ${npmInstalls.length}`);
  assert.equal(browserInstalls.length, 1, `expected one Chromium install, found ${browserInstalls.length}`);
});

test('single browser job retains targeted, visibility, and high-risk broad contracts', () => {
  assert.match(workflow, /name: Verify affected routes on desktop and mobile/);
  assert.match(workflow, /name: Verify all public pages are visibly rendered/);
  assert.match(workflow, /Verify broad high-risk browser contracts/);
  assert.match(workflow, /needs\.classify\.outputs\.risk_lane/);
});

test('page runtime validation uses the exact deploy preview instead of a synthetic localhost artifact', () => {
  assert.match(workflow, /page-seo:\n\s+needs: \[classify, preview-ready\]/);
  assert.match(workflow, /PAGINA_BASE_URL: https:\/\/deploy-preview-\$\{\{ inputs\.pr_number \}\}--bedrijfsgeheugen\.netlify\.app/);
  assert.match(pageCheck, /PAGINA_BASE_URL/);
  assert.match(pageCheck, /BASE_URL/);
});
