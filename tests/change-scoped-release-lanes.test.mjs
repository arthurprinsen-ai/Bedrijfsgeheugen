import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan, deriveRequiredTestSuites } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));

function suitesFor(paths, sha = 'abcdef1234567890') {
  const plan = createDeliveryPlan({ changedPaths: paths, headSha: sha, policy });
  return deriveRequiredTestSuites({ lanes: plan.lanes.map(lane => lane.id) });
}

test('website-only work blocks only shared and website required suites', () => {
  assert.deepEqual(suitesFor(['index.html']), {
    shared: true,
    backend: false,
    portal: false,
    website: true,
    automation: false,
  });
});

test('backend-only work blocks only shared and backend required suites', () => {
  assert.deepEqual(suitesFor(['platform/api/brain-gateway.mjs']), {
    shared: true,
    backend: true,
    portal: false,
    website: false,
    automation: false,
  });
});

test('portal-only work blocks only shared and portal required suites', () => {
  assert.deepEqual(suitesFor(['portal-next/app.mjs']), {
    shared: true,
    backend: false,
    portal: true,
    website: false,
    automation: false,
  });
});

test('automation-only work blocks only shared and automation required suites', () => {
  assert.deepEqual(suitesFor(['automation/contracts/customer-sync.json']), {
    shared: true,
    backend: false,
    portal: false,
    website: false,
    automation: true,
  });
});

test('shared executable delivery-control-plane work fans out to all required suites', () => {
  assert.deepEqual(suitesFor(['.github/workflows/required-test.yml']), {
    shared: true,
    backend: true,
    portal: true,
    website: true,
    automation: true,
  });
});

test('unknown suite lanes fail closed', () => {
  assert.throws(() => deriveRequiredTestSuites({ lanes: ['website', 'unknown-future-lane'] }), /unknown required-test lane/i);
});

test('existing open PR shapes remain classified without branch rewriting', () => {
  assert.equal(suitesFor(['tools/site-shell/apply-shell.mjs']).website, true, 'homepage/site-shell fixes remain website');
  assert.equal(suitesFor(['pages/prijzen.html']).website, true, 'prices fixes remain website');
  assert.equal(suitesFor(['portal-next/app.mjs']).portal, true, 'Portal Next remains portal');
  const growth = suitesFor(['netlify/functions/growth-event.mjs','tools/seo-growth/measurement.mjs']);
  assert.equal(growth.backend, true, 'growth runtime remains backend');
  assert.equal(growth.website, true, 'growth SEO surface remains website');
});

test('Required test workflow keeps stable status identity and becomes lane-aware', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml', 'utf8');
  assert.match(workflow, /^name:\s*Required test/m);
  assert.match(workflow, /deriveRequiredTestSuites/);
  assert.match(workflow, /steps\.scope\.outputs\.backend/);
  assert.match(workflow, /steps\.scope\.outputs\.portal/);
  assert.match(workflow, /steps\.scope\.outputs\.website/);
  assert.match(workflow, /steps\.scope\.outputs\.automation/);
});
