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

test('Netlify routing config is classified as website delivery', () => {
  assert.deepEqual(suitesFor(['netlify.toml']), { shared:true, backend:false, portal:false, website:true, automation:false });
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

test('approved central blog workflow is automation-only and does not require a website preview', () => {
  assert.deepEqual(suitesFor(['.github/workflows/approved-central-blog.yml']), { shared:true, backend:false, portal:false, website:false, automation:true });
});

test('scheduled approved-blog workflow parses the writer JSON array instead of treating it as JSONL', async () => {
  const workflow = await readFile('.github/workflows/approved-central-blog.yml', 'utf8');
  assert.match(workflow, /candidates\s*=\s*json\.loads\(path\.read_text\(encoding='utf-8'\)\)/);
  assert.match(workflow, /for\s+item\s+in\s+candidates:/);
  assert.doesNotMatch(workflow, /raw\.startswith\('\{'\)/);
});

test('approved blog writer emits FAQPage schema and two accessible functional figures', async () => {
  const writer = await readFile('scripts/publish_approved_blog_v2.py', 'utf8');
  assert.match(writer, /def faq_items\(/);
  assert.match(writer, /'@type': 'FAQPage'/);
  assert.match(writer, /'@type': 'Question'/);
  assert.match(writer, /'@type': 'Answer'/);
  assert.match(writer, /def article_figures\(/);
  assert.match(writer, /<figure/);
  assert.match(writer, /role="img"/);
  assert.match(writer, /<figcaption>/);
});

test('approved blog workflow reruns when canonical writer changes', async () => {
  const workflow = await readFile('.github/workflows/approved-central-blog.yml', 'utf8');
  assert.match(workflow, /scripts\/publish_approved_blog_v2\.py/);
});

test('canonical approved blog writer is a non-artifact generator change until it emits a blog candidate', async () => {
  const risk = JSON.parse(await readFile('site/website-release-risk.json', 'utf8'));
  assert.ok(risk.nonArtifactPaths.includes('scripts/publish_approved_blog_v2.py'));
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

test('protected LinkedIn revenue cockpit component is delivery-classified', () => {
  const suites = suitesFor([
    '_redirects',
    'intern/linkedin-revenue/index.html',
    'intern/linkedin-revenue/cockpit.js',
    'platform/linkedin-revenue-cockpit.mjs',
    'netlify/functions/linkedin-revenue-cockpit.mjs',
    'tests/linkedin-revenue-cockpit.test.mjs',
    'tests/linkedin-revenue-runtime.test.mjs'
  ]);
  assert.equal(suites.portal, true);
  assert.equal(suites.backend, true);
});

test('Required test keeps stable status identity and is lane-aware', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(workflow, /^name:\s*Required test/m);
  assert.match(workflow, /merge_group:\s*\n\s+types:\s*\[checks_requested\]/);
  assert.match(workflow, /github-event-context\.mjs/);
  assert.match(workflow, /deriveRequiredTestSuites/);
  assert.match(workflow, /steps\.scope\.outputs\.backend/);
  assert.match(workflow, /steps\.scope\.outputs\.portal/);
  assert.match(workflow, /steps\.scope\.outputs\.website/);
  assert.match(workflow, /steps\.scope\.outputs\.automation/);
  assert.match(workflow, /v18-megamenu-heading-contract\.test\.mjs/);
  assert.match(workflow, /v18-megamenu-browser-check\.mjs/);
});

test('V18 promotion separates website and portal gates', async () => {
  const workflow = await readFile('.github/workflows/v18-production-promotion.yml','utf8');
  assert.match(workflow, /steps\.scope\.outputs\.website/);
  assert.match(workflow, /steps\.scope\.outputs\.portal/);
  assert.match(workflow, /Verify website V18 production contracts/);
  assert.match(workflow, /Verify portal production contracts/);
});