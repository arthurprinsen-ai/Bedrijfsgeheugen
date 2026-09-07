import test from 'node:test';
import assert from 'node:assert/strict';
import { maakBeweeglijk, BEWEGING_CSS } from '../tools/v18-beweging.mjs';

test('structural content sections are never promoted to 3D compositor layers', () => {
  const html = '<section class="blok"><div class="kaart">Kaart</div><div class="tegel">Tegel</div></section>';
  const out = maakBeweeglijk(html);
  assert.match(out, /<section class="blok">/);
  assert.doesNotMatch(out, /<section class="blok bgx-kantel">/);
  assert.match(out, /class="kaart bgx-kantel"/);
  assert.match(out, /class="tegel bgx-kantel"/);
});

test('tilt cards do not reserve permanent GPU compositor layers', () => {
  assert.doesNotMatch(BEWEGING_CSS, /\.bgx-kantel\{[^}]*will-change:transform/);
});
