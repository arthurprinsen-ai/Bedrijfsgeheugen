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

test('required test can never skip the all-public-pages visibility gate for menu-only website changes', async () => {
  const workflow = await readFile('.github/workflows/required-test.yml', 'utf8');
  const marker = '- name: Verify all public pages are visibly rendered';
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, 'all-public-pages visibility step must exist');
  const tail = workflow.slice(start);
  const nextStep = tail.indexOf('\n      - name:', marker.length);
  const step = nextStep === -1 ? tail : tail.slice(0, nextStep);
  assert.match(step, /steps\.scope\.outputs\.website == 'true'/, 'visibility crawl must run for website changes');
  assert.doesNotMatch(step, /menu_only/, 'visibility crawl must not be bypassed for menu-only changes');
  assert.match(step, /standalone-visibility-check\.mjs/, 'visibility crawl must execute the full public-page checker');
});
