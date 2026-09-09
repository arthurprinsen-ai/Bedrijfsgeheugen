import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BEWEGING_CSS, BEWEGING_JS, vergelijker, maakBeweeglijk } from '../tools/v18-beweging.mjs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

// Chrome visibility is a release invariant: public content wins over animation.
test('vergelijker houdt beide tekstlagen op een vaste layout terwijl alleen het masker beweegt', () => {
  assert.match(
    BEWEGING_CSS,
    /\.bgx-vergelijk \.straks\{[^}]*padding:30px 28px[^}]*clip-path:inset\(0 0 0 var\(--bgx-grens,50%\)\)/s,
    'De rechter tekstlaag moet vaste padding houden; alleen het masker mag de scheidslijn volgen.'
  );
  assert.doesNotMatch(
    BEWEGING_CSS,
    /padding-left:calc\(var\(--bgx-grens,50%\)/,
    'De sliderpositie mag de tekstlayout niet meer verschuiven.'
  );
  assert.match(
    BEWEGING_CSS,
    /\.bgx-vergelijk \.nu li\{[^}]*color:rgba\(255,255,255,\.9\)!important/s,
    'Tekst aan de donkere kant moet expliciet voldoende contrast houden.'
  );
  assert.match(
    BEWEGING_CSS,
    /\.bgx-vergelijk\{[^}]*touch-action:pan-y/s,
    'Verticaal scrollen op mobiel moet mogelijk blijven terwijl horizontaal slepen wordt afgehandeld.'
  );
});

test('vergelijker kan exact van 0 tot 100 procent worden gesleept', () => {
  assert.doesNotMatch(BEWEGING_JS, /minPanePx|minPct/);
  assert.match(BEWEGING_JS, /deel = Math\.max\(0, Math\.min\(100, deel\)\)/);
  assert.match(BEWEGING_JS, /if \(e\.key === 'Home'\) pasToe\(0\)/);
  assert.match(BEWEGING_JS, /if \(e\.key === 'End'\) pasToe\(100\)/);
  const html = vergelijker('bedrijfsgeheugen');
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="100"/);
});

test('vergelijker is ook met toetsenbord bedienbaar en rapporteert zijn grens', () => {
  const html = vergelijker('bedrijfsgeheugen');
  assert.match(html, /role="separator"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.match(html, /aria-valuenow="50"/);
  assert.doesNotMatch(html, /\sdata-op(?:\s|>|=)/, 'Ook de interactieve vergelijker mag niet via de reveal-laag verborgen starten.');
  assert.match(BEWEGING_JS, /\['ArrowLeft','ArrowRight','Home','End'\]/);
  assert.match(BEWEGING_JS, /greep\.setAttribute\('aria-valuenow', deel\.toFixed\(0\)\)/);
});

test('structurele contentblokken krijgen nooit een 3D compositor-laag', () => {
  const html = '<section class="blok"><div class="kaart">Kaart</div><div class="tegel">Tegel</div></section>';
  const out = maakBeweeglijk(html);
  assert.match(out, /<section class="blok">/);
  assert.doesNotMatch(out, /<section class="blok bgx-kantel">/);
  assert.match(out, /class="kaart bgx-kantel"/);
  assert.match(out, /class="tegel bgx-kantel"/);
});

test('kaartkanteling reserveert geen permanente GPU-laag', () => {
  assert.doesNotMatch(
    BEWEGING_CSS,
    /\.bgx-kantel\{[^}]*will-change:transform/,
    'Permanente will-change:transform kan Chrome/macOS blank-paints veroorzaken tot een resize de compositor herbouwt.'
  );
});

test('V18 publieke pagina-effecten gebruiken geen 3D compositor-primitieven', () => {
  assert.doesNotMatch(BEWEGING_CSS, /transform-style\s*:\s*preserve-3d/i, 'preserve-3d kan Chrome/macOS opnieuw in de blank-paint toestand brengen.');
  assert.doesNotMatch(BEWEGING_CSS, /translate3d\s*\(/i, 'de hero mag geen geforceerde 3D compositor-laag krijgen.');
  assert.doesNotMatch(BEWEGING_JS, /perspective\s*\(/i, 'kaartinteractie mag geen perspective-laag maken.');
  assert.doesNotMatch(BEWEGING_JS, /rotate[XY]\s*\(/i, 'kaartinteractie mag geen rotateX/rotateY-laag maken.');
});

test('oude structurele bgx-kantel-klassen worden tijdens de build opgeschoond', () => {
  const html = '<main><section class="inhoud-body blok bgx-kantel"><h2>Tekst blijft zichtbaar</h2></section></main>';
  const out = maakBeweeglijk(html);
  assert.match(out, /class="inhoud-body blok"/);
  assert.doesNotMatch(out, /\bblok\s+bgx-kantel\b/);
});

test('desktop Chrome mag publieke data-op inhoud nooit onzichtbaar maken', () => {
  assert.match(
    BEWEGING_CSS,
    /html\.bgx-beweegt \[data-op\]\s*\{[^}]*opacity:\s*1\s*!important[^}]*transform:\s*none\s*!important/s,
    'data-op inhoud mag nooit wachten op IntersectionObserver, scroll of een DevTools-resize om zichtbaar te worden.'
  );
});

test('standalone build verwijdert reveal-triggers uit gewone content', () => {
  const html = '<main><section class="blok" data-op><h2 data-op>Altijd zichtbaar</h2><p data-op>Tekst</p></section></main>';
  const out = maakBeweeglijk(html);
  assert.doesNotMatch(out, /\sdata-op(?:\s|>|=)/, 'Publieke content mag niet afhankelijk blijven van een reveal-trigger.');
  assert.match(out, /Altijd zichtbaar/);
  assert.match(out, />Tekst</);
});

test('woordanimatie heeft een zichtbare basistoestand', () => {
  assert.match(BEWEGING_CSS, /\.bgx-woord\{[^}]*opacity:\s*1[^}]*transform:\s*none/s);
});

test('V18 interactieve websitecode en regressietests horen bij de website delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['tools/v18-beweging.mjs', 'tests/v18-vergelijker.test.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0ffee1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['website'], `${path} must be website delivery work`);
  }
});
