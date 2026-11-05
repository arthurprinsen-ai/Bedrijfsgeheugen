import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/website-cross-browser-screenshot-assurance.yml','utf8');
test('original website browser sweep uses official exact-version prebuilt all-engine Playwright container',()=>{
  assert.match(workflow,/container:\s*\n\s*image: mcr\.microsoft\.com\/playwright:v1\.55\.0-noble/);
  assert.match(workflow,/npm install --no-save --ignore-scripts playwright@1\.55\.0/);
  assert.match(workflow,/BROWSER_BINARY_MISSING/);
  assert.match(workflow,/BROWSER_BINARY_PRESENT/);
  assert.match(workflow,/engine\.executablePath\(\)/);
  assert.doesNotMatch(workflow,/npx playwright install --with-deps/);
});
test('browser screenshot, mobile CLS, three-engine sweep and error artifact remain mandatory',()=>{
  assert.match(workflow,/node --test tests\/brain-website-cross-browser-screenshot-assurance-v1\.test\.mjs/);
  assert.match(workflow,/node tools\/site-shell\/website-cross-browser-assurance\.mjs/);
  assert.match(workflow,/ci-install-error\.json/);
  assert.match(workflow,/chromium firefox webkit/);
  assert.match(workflow,/retention-days: 30/);
  assert.match(workflow,/if-no-files-found: error/);
  assert.match(workflow,/timeout-minutes: 30/);
});
test('new apt timeout incident is typed ONE BRAIN learning until real screenshot proof',()=>{
  const lesson=JSON.parse(readFileSync('brain/learning/2026-11-05-cross-browser-playwright-181-dependency-timeout.json','utf8'));
  assert.equal(lesson.status,'CODE_CANDIDATE_UNVERIFIED');
  assert.equal(lesson.compiler.machine_enforceable,true);
  assert.equal(lesson.production_readback,'EVIDENCE_DUE');
  assert.ok(lesson.evaluation.historical_replay.includes('tests/brain-cross-browser-playwright-container-20261105.test.mjs'));
});
