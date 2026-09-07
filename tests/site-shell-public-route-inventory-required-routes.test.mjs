import test from 'node:test';
import assert from 'node:assert/strict';
import { routesFromSitemap } from '../tools/site-shell/public-route-inventory.mjs';

test('public inventory includes representative commercial and governance routes', () => {
  const xml = `<urlset>
    <url><loc>https://www.bedrijfsgeheugen.nl/</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/ai-act</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/benchmark</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/due-diligence</loc></url>
    <url><loc>https://www.bedrijfsgeheugen.nl/ai-automatisering-mkb</loc></url>
  </urlset>`;
  const routes = routesFromSitemap(xml);
  for (const required of ['/', '/ai-act', '/benchmark', '/due-diligence', '/ai-automatisering-mkb']) {
    assert.ok(routes.includes(required), `missing ${required}`);
  }
});
