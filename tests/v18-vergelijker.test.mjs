import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BEWEGING_CSS, BEWEGING_JS, vergelijker } from '../tools/v18-beweging.mjs';
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

test('V18 interactieve websitecode en regressietests horen bij de website delivery lane', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of ['tools/v18-beweging.mjs', 'tests/v18-vergelijker.test.mjs']) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'c0ffee1234567890', policy });
    assert.deepEqual(plan.lanes.map(lane => lane.id), ['website'], `${path} must be website delivery work`);
  }
});
