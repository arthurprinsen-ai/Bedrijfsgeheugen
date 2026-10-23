import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { routesFromSitemap } from '../tools/site-shell/public-route-inventory.mjs';

test('public route inventory derives every same-site public route from sitemap and ignores non-page assets', () => {
  const xml = `<?xml version="1.0"?><urlset>
    <url><loc>https://www.bedrijfsgeheugen.nl/</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/ai-act</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/benchmark</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/blog/eu-ai-act-mkb/</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/assets/logo.png</loc></url>
    <url><loc>https://example.com/foreign</loc></url>
  </urlset>`;
  assert.deepEqual(routesFromSitemap(xml, 'https://www.bedrijfsgeheugen.nl'), [
    '/', '/ai-act', '/benchmark', '/blog/eu-ai-act-mkb/'
  ]);
});

test('public route inventory de-duplicates and normalizes absolute/relative URLs', () => {
  const xml = `<urlset>
    <url><loc>https://www.bedrijfsgeheugen.nl/ai-act</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/ai-act/</loc></url>
    <url><loc>/prijzen</loc></url>
  </urlset>`;
  assert.deepEqual(routesFromSitemap(xml, 'https://www.bedrijfsgeheugen.nl'), ['/ai-act', '/prijzen']);
});

test('website lane can never skip any sitemap or viewport visibility gate', async () => {
  const workflow = await readFile('.github/workflows/lane-website.yml', 'utf8');
  const required = await readFile('.github/workflows/required-test.yml', 'utf8');
  const shardStart = workflow.indexOf('\n  browser-visibility:\n');
  const originalStart = workflow.indexOf('\n  browser:\n');
  assert.ok(shardStart >= 0 && originalStart > shardStart,
    'all-public-pages visibility must run in a required matrix adjacent to the original browser');
  const job = workflow.slice(shardStart,originalStart);
  const marker = '- name: Verify all public pages are visibly rendered';
  const start = job.indexOf(marker);
  assert.notEqual(start,-1,'all-public-pages visibility must remain mandatory');
  const tail = job.slice(start);
  const nextStep = tail.indexOf('\n      - name:',marker.length);
  const step = nextStep === -1 ? tail : tail.slice(0,nextStep);
  assert.doesNotMatch(step,/menu_only/, 'visibility may not be bypassed for menu-only changes');
  assert.doesNotMatch(step,/\n\s+if:/, 'visibility must be unconditional within each required viewport shard');
  assert.match(step,/standalone-visibility-check\.mjs/, 'the original full-public-sitemap checker must run');
  assert.match(step,/UI_VR_VIEWPORT_SHARD: \$\{\{ matrix\.viewport \}\}/,
    'each job must pin an exactly one viewport');
  assert.match(job,/viewport: \[phone, tablet, desktop\]/, 'all viewports must be represented');
  assert.match(job,/fail-fast: false/,'all viewport shards must complete even when one fails');
  assert.doesNotMatch(job,/continue-on-error: true/,'no viewport is optional');
  assert.match(job,/needs: \[classify, syntax-preflight, preview-ready\]/,
    'visibility must use exact candidate source and preview preflight');
  assert.match(workflow,/\n  browser:\n\s+needs: \[classify, syntax-preflight, preview-ready\]/,
    'original browser contracts still need same preflight and exact preview');
  assert.match(workflow,/Fail closed on missing browser matrix or incomplete viewport coverage/,
    'the completeness test must run in early website preflight');
  assert.match(required,/uses: \.\/\.github\/workflows\/lane-website\.yml/,
    'protected Required must use the entire reusable website workflow');
  assert.match(required,/needs\.website\.result/,
    'an unsuccessful viewport shard must block the Required aggregate');
});

test('final website pipeline re-applies Kennisbank navigation estate-wide before sitemap and SEO verification', async () => {
  const source = await readFile('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(source, /ensureKnowledgeNavigation/);
  assert.match(source, /verifyKnowledgeNavigation/);
  assert.match(source, /glob\('\*\.html'\)/, 'finalizer must cover root public pages');
  assert.match(source, /glob\('blog\/\*\/index\.html'\)/, 'finalizer must cover article pages');
  const finalizer = source.indexOf('await borgFinaleKennisNavigatie()');
  const sitemap = source.indexOf('await genereerSitemap()', finalizer);
  const siteUi = source.indexOf('await controleerSiteUi()', sitemap);
  const technicalSeo = source.indexOf('await controleerTechnischeSeo()', siteUi);
  assert.ok(finalizer >= 0, 'finale Kennisbank-normalisatie moet onderdeel zijn van de website verify-stage');
  assert.ok(sitemap > finalizer, 'sitemap moet de definitieve Kennisbank-navigatie zien');
  assert.ok(siteUi > sitemap, 'global-component hashcontrole moet na estate-wide Kennis-normalisatie draaien');
  assert.ok(technicalSeo > siteUi, 'technische SEO moet de definitieve sitemap en navigatie controleren');
});

// Keep these regression contracts in the website lane so final public output cannot silently regress.
