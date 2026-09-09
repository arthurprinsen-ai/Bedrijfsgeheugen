import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BEWEGING_CSS, BEWEGING_JS, vergelijker, maakBeweeglijk } from '../tools/v18-beweging.mjs';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

test('vergelijker houdt beide tekstlagen leesbaar tijdens slepen', () => {
  assert.match(
    BEWEGING_CSS,
    /\.bgx-vergelijk \.straks\{[^}]*padding-left:calc\(var\(--bgx-grens,50%\) \+ 28px\)[^}]*clip-path:inset\(0 0 0 var\(--bgx-grens,50%\)\)/s,
    'De rechter tekst en de clipgrens moeten exact dezelfde scheidslijn volgen.'
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

test('vergelijker kan nooit tot een onleesbare 6/94-eindstand worden gesleept', () => {
  assert.match(BEWEGING_JS, /var minPanePx = Math\.min\(180, Math\.max\(132, r\.width \* \.28\)\)/);
  assert.match(BEWEGING_JS, /var minPct = Math\.min\(45, minPanePx \/ Math\.max\(1, r\.width\) \* 100\)/);
  assert.match(BEWEGING_JS, /deel = Math\.max\(g\.min, Math\.min\(g\.max, deel\)\)/);
  assert.doesNotMatch(
    BEWEGING_JS,
    /Math\.max\(6,\s*Math\.min\(94/,
    'De oude 6–94%-clamp maakte tekst aan de rand onleesbaar en mag nooit terugkomen.'
  );
});

test('vergelijker is ook met toetsenbord bedienbaar en rapporteert zijn grens', () => {
  const html = vergelijker('bedrijfsgeheugen');
  assert.match(html, /role="separator"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.match(html, /aria-valuenow="50"/);
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

test('V18 interactieve websitecode en regressietests horen bij de website delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['tools/v18-beweging.mjs', 'tests/v18-vergelijker.test.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0ffee1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['website'], `${path} must be website delivery work`);
  }
});
