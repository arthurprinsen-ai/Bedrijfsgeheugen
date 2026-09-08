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

test('website lane can never skip the all-public-pages visibility gate', async () => {
  const workflow = await readFile('.github/workflows/lane-website.yml', 'utf8');
  const marker = '- name: Verify all public pages are visibly rendered';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'all-public-pages visibility step must exist in website lane');
  const tail = workflow.slice(start);
  const nextStep = tail.indexOf('\n      - name:', marker.length);
  const step = nextStep === -1 ? tail : tail.slice(0, nextStep);
  assert.doesNotMatch(step, /menu_only/, 'visibility crawl must not be bypassed for menu-only changes');
  assert.doesNotMatch(step, /\n\s+if:/, 'visibility crawl must remain unconditional inside the browser job');
  assert.match(step, /standalone-visibility-check\.mjs/, 'visibility crawl must execute the full public-page checker');
  assert.match(workflow, /\n  browser:\n\s+needs: \[classify, syntax-preflight, preview-ready\]/, 'shared browser job must wait for syntax preflight and the exact deploy preview');
});

// Keep this regression contract in the website lane so the fail-closed crawl can never silently disappear.
