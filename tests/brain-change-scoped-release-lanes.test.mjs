import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';
import { deriveRequiredTestSuites } from '../tools/delivery-required-test-suites.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

function suitesFor(paths, sha = 'abcdef1234567890') {
  const plan = createDeliveryPlan({ changedPaths: paths, headSha: sha, policy });
  return deriveRequiredTestSuites({ lanes: plan.lanes.map(lane => lane.id) });
}

test('website-only work blocks only shared and website required suites', () => {
  assert.deepEqual(suitesFor(['index.html']), { shared:true, backend:false, portal:false, website:true, automation:false });
});

test('backend-only work blocks only shared and backend required suites', () => {
  assert.deepEqual(suitesFor(['platform/api/brain-gateway.mjs']), { shared:true, backend:true, portal:false, website:false, automation:false });
});

test('portal-only work blocks only shared and portal required suites', () => {
  assert.deepEqual(suitesFor(['portal-next/app.mjs']), { shared:true, backend:false, portal:true, website:false, automation:false });
});

test('automation-only work blocks only shared and automation required suites', () => {
  assert.deepEqual(suitesFor(['automation/contracts/customer-sync.json']), { shared:true, backend:false, portal:false, website:false, automation:true });
});

test('shared executable control-plane work fans out to all required suites', () => {
  assert.deepEqual(suitesFor(['.github/workflows/required-test.yml']), { shared:true, backend:true, portal:true, website:true, automation:true });
});

test('unknown suite lanes fail closed', () => {
  assert.throws(() => deriveRequiredTestSuites({ lanes:['website','unknown-future-lane'] }), /unknown required-test lane/i);
});

test('current product work keeps its lane without rewriting the branch', () => {
  assert.equal(suitesFor(['tools/site-shell/apply-shell.mjs']).website, true);
  assert.equal(suitesFor(['pages/prijzen.html']).website, true);
  assert.equal(suitesFor(['portal-next/app.mjs']).portal, true);
  const growth = suitesFor(['netlify/functions/growth-event.mjs','tools/seo-growth/measurement.mjs']);
  assert.equal(growth.backend, true);
  assert.equal(growth.website, true);
});

test('Required test keeps stable status identity and delegates lane ownership', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml','utf8');
  const website = await readFile('.github/workflows/lane-website.yml','utf8');
  assert.match(workflow, /^name:\s*Required test/m);
  assert.match(workflow, /deriveRequiredTestSuites/);
  assert.match(workflow, /steps\.scope\.outputs\.backend/);
  assert.match(workflow, /steps\.scope\.outputs\.portal/);
  assert.match(workflow, /steps\.scope\.outputs\.website/);
  assert.match(workflow, /steps\.scope\.outputs\.automation/);
  assert.match(workflow, /uses:\s*\.\/\.github\/workflows\/lane-website\.yml/);
  assert.match(workflow, /name:\s*test/);
  assert.match(website, /v18-megamenu-heading-contract\.test\.mjs/);
  assert.match(website, /v18-megamenu-browser-check\.mjs/);
});

test('V18 promotion contracts are owned by canonical website and portal lanes', async () => {
  const standalone = await readFile('.github/workflows/v18-production-promotion.yml','utf8');
  const website = await readFile('.github/workflows/lane-website.yml','utf8');
  const portal = await readFile('.github/workflows/lane-portal.yml','utf8');
  assert.doesNotMatch(standalone, /(^|\n)\s{0,2}pull_request\s*:/m);
  assert.match(website, /tests\/v18-production-promotion\.test\.mjs/);
  assert.match(website, /tests\/v18-seo-layer\.test\.mjs/);
  assert.match(portal, /tests\/portal-/);
});
