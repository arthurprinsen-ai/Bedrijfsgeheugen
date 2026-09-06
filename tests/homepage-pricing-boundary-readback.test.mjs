import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLiveSeoOrderSet } from '../tools/seo-order-engine/live-readback.mjs';

const homepageWithPricingOnlyUi = `<!doctype html>
<html><head><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/"></head>
<body>
  <main>
    <button>Vraag het deze pagina</button>
    <section>Reken het even na</section>
    <button>Kies je rol</button>
  </main>
</body></html>`;

test('live readback blocks pricing-only UI on the homepage', () => {
  const errors = validateLiveSeoOrderSet([
    {
      path: 'live-home.html',
      canonical: 'https://www.bedrijfsgeheugen.nl/',
      html: homepageWithPricingOnlyUi,
    },
  ], { pages: [] });

  assert.ok(
    errors.some((error) => error.includes('pricing-only UI op homepage')),
    `expected homepage pricing-boundary error, got:\n${errors.join('\n')}`,
  );
});
