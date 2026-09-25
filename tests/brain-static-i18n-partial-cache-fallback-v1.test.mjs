import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const pricingPatch = JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));

test('offline production applies known cached English even when unrelated strings are missing', () => {
  assert.equal(pricingPatch['Prijzen voor digitalisering in het mkb'],'Pricing for digitalization in SMEs');
  assert.match(source,/return \{ map:result, complete:false, missing:\[\.\.\.missing\] \}/);
  assert.match(source,/if \(translations\.size\)/);
  assert.match(source,/allowMissing:translationState\?\.complete !== true/);
  assert.match(source,/data-bg-static-translated/);
});

test('partial static English remains explicitly marked for runtime completion', () => {
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,translationState\?\.complete === true\)/);
  assert.match(source,/runtimeFallback:translationState\?\.complete !== true/);
  assert.match(source,/cachedEnglishApplied:translations\.size/);
});
