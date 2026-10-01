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

test('website lane always verifies affected public routes with the visibility gate', async () => {
  const workflow = await readFile('.github/workflows/lane-website.yml', 'utf8');
  const marker = '- name: Verify affected public pages are visibly rendered';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'affected-route visibility step must exist in website lane');
  const tail = workflow.slice(start);
  const nextStep = tail.indexOf('\n      - name:', marker.length);
  const step = nextStep === -1 ? tail : tail.slice(0, nextStep);
  assert.doesNotMatch(step, /menu_only/, 'visibility crawl must not be bypassed for menu-only changes');
  assert.doesNotMatch(step, /\n\s+if:/, 'affected-route visibility crawl must remain unconditional inside the browser job');
  assert.match(step, /UI_VR_ROUTES_JSON/, 'visibility crawl must receive the classified affected routes');
  assert.match(step, /standalone-visibility-check\.mjs/, 'visibility crawl must execute the public-page checker');
  assert.match(workflow, /\n  browser:\n\s+needs: \[classify, syntax-preflight, preview-ready, netlify-build-parity\]/, 'shared browser job must wait for syntax preflight and the exact deploy preview');
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
