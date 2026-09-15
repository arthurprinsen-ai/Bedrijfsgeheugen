import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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

test('scheduled approved-blog workflow resolves exactly one due slug through the canonical selector', async () => {
  const workflow = await readFile('.github/workflows/approved-central-blog.yml', 'utf8');
  assert.match(workflow, /--select-due-slug/);
  assert.match(workflow, /NO_DUE_BLOG/);
  assert.doesNotMatch(workflow, /jsonl/);
});

test('approved blog recovery trigger is exact-slug, native, and automation-classified', async () => {
  const workflow = await readFile('.github/workflows/approved-central-blog.yml', 'utf8');
  const trigger = JSON.parse(await readFile('automation/contracts/approved-blog-trigger.json', 'utf8'));
  assert.match(workflow, /automation\/contracts\/approved-blog-trigger\.json/);
  assert.match(workflow, /EVENT_NAME/);
  assert.match(workflow, /invalid approved-blog recovery trigger slug/);
  assert.match(trigger.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(suitesFor(['automation/contracts/approved-blog-trigger.json']).automation, true);
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

test('approved blog writer strips remote font links while preserving unrelated links', () => {
  const probe = [
    "import sys",
    "sys.path.insert(0, 'scripts')",
    "import publish_approved_blog_v2 as writer",
    "sample = '''<head><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\"><link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Inter\"><link rel=\"stylesheet\" href=\"/assets/site.css\"></head>'''",
    "print(writer.normalize_performance(sample))",
  ].join('\n');
  const output = execFileSync('python3', ['-c', probe], { encoding:'utf8' });
  assert.doesNotMatch(output, /fonts\.googleapis\.com/);
  assert.doesNotMatch(output, /fonts\.gstatic\.com/);
  assert.match(output, /href=\"\/assets\/site\.css\"/);
});

test('approved blog writer keeps analytics out of the first render until consent or after load', () => {
  const probe = [
    "import sys",
    "sys.path.insert(0, 'scripts')",
    "import publish_approved_blog_v2 as writer",
    "sample = '''<head><!-- Google tag (gtag.js) --><script async src=\"https://www.googletagmanager.com/gtag/js?id=G-912L0PB68G\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}try{ if(localStorage.getItem('bg_consent')==='granted'){ gtag('consent','update',{analytics_storage:'granted'}); } }catch(e){}</script><link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Inter\"><link rel=\"stylesheet\" href=\"/assets/site.css\"><script data-goatcounter=\"https://bedrijfsgeheugen.goatcounter.com/count\" async src=\"https://gc.zgo.at/count.js\"></script></head>'''",
    "print(writer.normalize_performance(sample))",
  ].join('\n');
  const output = execFileSync('python3', ['-c', probe], { encoding: 'utf8' });
  assert.doesNotMatch(output, /<script async src=\"https:\/\/www\.googletagmanager\.com\/gtag\/js/);
  assert.match(output, /function bgLoadGoogleAnalytics\(\)/);
  assert.match(output, /analytics_storage==='granted'/);
  assert.doesNotMatch(output, /<script data-goatcounter=.*src=\"https:\/\/gc\.zgo\.at\/count\.js/);
  assert.match(output, /setTimeout\(loadGoat,5000\)/);
  assert.doesNotMatch(output, /fonts\.googleapis\.com/);
  assert.match(output, /href=\"\/assets\/site\.css\"/);
});

test('approved blog workflow references the canonical writer', async () => {
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
