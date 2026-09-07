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

test('Required test keeps stable protected status identity and parallel lane-aware jobs', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(workflow, /^name:\s*Required test/m);
  assert.match(workflow, /\n  scope:\n[\s\S]*?name:\s*classify release scope/);
  assert.match(workflow, /\n  static:\n[\s\S]*?needs:\s*scope/);
  assert.match(workflow, /\n  browser:\n[\s\S]*?needs:\s*scope/);
  assert.match(workflow, /\n  test:\n\s+name:\s*test\n\s+needs:\s*\[scope, static, browser\]/);
  assert.match(workflow, /needs\.scope\.outputs\.backend/);
  assert.match(workflow, /needs\.scope\.outputs\.portal/);
  assert.match(workflow, /needs\.scope\.outputs\.website/);
  assert.match(workflow, /needs\.scope\.outputs\.automation/);
  assert.match(workflow, /deriveRequiredTestSuites/);
});

test('browser verification is risk-selected and unrelated lanes do not acquire browser work', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(workflow, /browser:\n[\s\S]*?if:\s*github\.event_name == 'pull_request' && needs\.scope\.outputs\.browser_required == 'true'/);
  assert.match(workflow, /Verify affected routes on desktop and mobile[\s\S]*?if:\s*needs\.scope\.outputs\.targeted_browser == 'true'/);
  assert.match(workflow, /Verify focused megamenu[\s\S]*?if:\s*needs\.scope\.outputs\.menu_browser == 'true' && needs\.scope\.outputs\.full_browser != 'true'/);
  assert.match(workflow, /Run full website browser regression[\s\S]*?if:\s*needs\.scope\.outputs\.full_browser == 'true'/);
  assert.doesNotMatch(workflow, /steps\.scope\.outputs\.menu_only/);
});

test('full browser regression remains fail-closed for global website surface changes', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(workflow, /Run full website browser regression/);
  assert.match(workflow, /seo-ui-visual-regression-browser\.test\.mjs/);
  assert.match(workflow, /v18-megamenu-browser-check\.mjs/);
  assert.match(workflow, /ui-visual-regression\/browser-check\.mjs/);
  assert.match(workflow, /standalone-visibility-check\.mjs/);
});

test('moving-main evidence is checked after selected suites and preserves non-overlapping candidates', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(workflow, /Keep green evidence only across non-overlapping main drift/);
  assert.match(workflow, /deriveConflictContracts, evaluateBranchDrift/);
  assert.match(workflow, /evaluateReleaseBase/);
  assert.match(workflow, /git fetch origin main --no-tags/);
});

test('V18 promotion separates website and portal gates', async () => {
  const workflow = await readFile('.github/workflows/v18-production-promotion.yml','utf8');
  assert.match(workflow, /steps\.scope\.outputs\.website/);
  assert.match(workflow, /steps\.scope\.outputs\.portal/);
  assert.match(workflow, /Verify website V18 production contracts/);
  assert.match(workflow, /Verify portal production contracts/);
});
