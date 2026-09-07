import test from 'node:test';
import assert from 'node:assert/strict';
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
