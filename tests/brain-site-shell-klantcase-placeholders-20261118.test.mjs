import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { removeKlantcasePlaceholders } from '../tools/site-shell/remove-klantcase-placeholders.mjs';

const card = text => '<article class="review-card reveal-up"><span class="review-stars">★★★★★</span><h3>“x”</h3><p>' + text + '</p></article>';
const wrap = cards => '<main><section class="reviews-section"><div class="wrap">' + cards + '</div></section><section class="big-cta">cta</section></main>';

test('removes a section that only holds reserved placeholder cards, keeps the rest', () => {
  const html = wrap(card('Voorbeeldplaatsing: quote') + card('<small>GERESERVEERD VOOR KLANTCASE 02</small>'));
  const result = removeKlantcasePlaceholders(html);
  assert.ok(!/reviews-section|review-card/.test(result));
  assert.match(result, /big-cta/);
});

test('keeps a section that holds even one real review', () => {
  const html = wrap(card('Voorbeeldplaatsing: quote') + card('Echte klant, echt resultaat.'));
  assert.equal(removeKlantcasePlaceholders(html), html);
});

test('is idempotent, handles English placeholders and pages without the section', () => {
  const en = wrap(card('<small>RESERVED FOR CUSTOMER CASE 01</small>'));
  const once = removeKlantcasePlaceholders(en);
  assert.equal(removeKlantcasePlaceholders(once), once);
  assert.ok(!/review-card/.test(once));
  assert.equal(removeKlantcasePlaceholders('<main>x</main>'), '<main>x</main>');
});

test('step runs after localization in the build pipeline', () => {
  const pipeline = readFileSync('tools/ci/netlify-build-entry.mjs', 'utf8');
  assert.ok(pipeline.indexOf("['klantcase-placeholders'") > pipeline.indexOf("['localized-routes'"));
});
