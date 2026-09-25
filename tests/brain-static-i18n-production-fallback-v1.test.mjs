import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('offline static i18n preserves cached English and falls back only for missing strings', () => {
  const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/STATIC_I18N_PARTIAL_CACHE_FALLBACK/);
  assert.match(source,/return result;/);
  assert.match(source,/allowMissing:!productionTranslationRequired/);
  assert.match(source,/missingForRoute\.length === 0/);
  assert.match(source,/runtimeFallback:untranslatedRefs > 0/);
  assert.doesNotMatch(source,/STATIC_I18N_OFFLINE_RELEASE English generation skipped/);
});

test('provider failure keeps already cached translations available for route generation', () => {
  const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.match(source,/catch \(error\) \{[\s\S]*STATIC_I18N_PROVIDER_FALLBACK[\s\S]*return result;/);
});

test('pricing H1 has deterministic cached English fragments', () => {
  const patch=JSON.parse(fs.readFileSync('config/bg-static-i18n-en.d/2026-09-25-pricing-h1.json','utf8'));
  assert.equal(patch['Prijzen voor digitalisering in het mkb'],'Pricing for digitalization in SMEs');
  assert.equal(patch['Prijzen voor'],'Pricing for');
  assert.equal(patch['digitalisering'],'digitalization');
  assert.equal(patch['in het mkb'],'in SMEs');
});
