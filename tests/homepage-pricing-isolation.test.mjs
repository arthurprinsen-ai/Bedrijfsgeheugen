import test from 'node:test';
import assert from 'node:assert/strict';

import {
  homepagePricingIsolationFailures,
} from '../tools/homepage-pricing-isolation.mjs';

test('homepage pricing isolation rejects pricing-only UI signatures', () => {
  const html = `
    <main>
      <section id="scenario-prijzen-home">Vraag het deze pagina</section>
      <section id="pakketten-home">Reken het even na</section>
      <div>Kies je rol</div>
    </main>
  `;

  const failures = homepagePricingIsolationFailures(html);

  assert.ok(failures.some((message) => message.includes('scenario-prijzen-home')));
  assert.ok(failures.some((message) => message.includes('pakketten-home')));
  assert.ok(failures.some((message) => message.includes('Vraag het deze pagina')));
  assert.ok(failures.some((message) => message.includes('Reken het even na')));
  assert.ok(failures.some((message) => message.includes('Kies je rol')));
});

test('homepage pricing isolation rejects a generic homepage prijzen section', () => {
  const failures = homepagePricingIsolationFailures('<section class="section section-soft" id="prijzen">Prijsinformatie</section>');
  assert.ok(failures.some((message) => message.includes('#prijzen')));
});

test('homepage pricing isolation accepts a homepage without pricing-only UI', () => {
  assert.deepEqual(
    homepagePricingIsolationFailures('<main><h1>Bedrijfsgeheugen</h1><p>Aanpakken zonder aanmodderen.</p></main>'),
    [],
  );
});
