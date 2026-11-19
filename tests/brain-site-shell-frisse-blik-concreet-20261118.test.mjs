import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyFrisseBlikConcreet } from '../tools/site-shell/apply-frisse-blik-concreet.mjs';

const live = '<main><section class="inhoud-kop"><h1>Frisse blik</h1></section><section class="inhoud-body" style="padding:34px 0 6px"><div class="wrap"></div></section><section class="v17-scan-page v17-scan-deep"><div class="wrap"></div></section></main>';

test('Frisse blik names price, duration-free next steps and the free first step in plain language', () => {
  const result = applyFrisseBlikConcreet(live, 'nl');
  assert.match(result, /data-bg-frisse-concreet="v1"/);
  assert.match(result, /href="\/zelfscan"/);
  assert.match(result, /€ 2\.950 excl\. btw/);
  assert.match(result, /vaste prijs vooraf/);
  assert.match(result, /Nu niet kopen is ook een geldige uitkomst/);
  assert.equal((result.match(/<h1/g) || []).length, 1, 'never adds a second hero');
});

test('block is idempotent and also exists in English', () => {
  const nl = applyFrisseBlikConcreet(live, 'nl');
  assert.equal(applyFrisseBlikConcreet(nl, 'nl'), nl);
  const en = applyFrisseBlikConcreet(live, 'en');
  assert.match(en, /fixed price up front/);
  assert.match(en, /href="\/en\/zelfscan"/);
});

test('falls back to inserting before the scan section and never silently skips a missing anchor', () => {
  const withoutBody = '<main><section class="v17-scan-page"><div class="wrap"></div></section></main>';
  assert.match(applyFrisseBlikConcreet(withoutBody, 'nl'), /data-bg-frisse-concreet="v1"/);
  assert.throws(() => applyFrisseBlikConcreet('<main></main>', 'nl'), /FRISSE_BLIK_CONCREET_NO_ANCHOR/);
  assert.throws(() => applyFrisseBlikConcreet(live, 'de'), /FRISSE_BLIK_CONCREET_LOCALE_UNSUPPORTED/);
});

test('copy makes no guarantee, no scarcity and no exclamation marks', () => {
  const text = applyFrisseBlikConcreet(live, 'nl').replace(/<[^>]+>/g, ' ');
  assert.ok(!/garantie|gegarandeerd|nog maar|laatste kans|!/i.test(text));
});

test('step runs after localization and the commercial pricing pass', () => {
  const pipeline = readFileSync('tools/ci/netlify-build-entry.mjs', 'utf8');
  const pricing = pipeline.indexOf("['commercial-pricing'");
  const locale = pipeline.indexOf("['localized-routes'");
  const step = pipeline.indexOf("['frisse-blik-concreet'");
  assert.ok(locale > 0 && pricing > locale && step > pricing);
});
