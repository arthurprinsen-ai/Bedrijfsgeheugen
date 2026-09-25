import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('offline static i18n keeps cached translations when unrelated strings are missing', () => {
  const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source, /STATIC_I18N_OFFLINE_PARTIAL_CACHE/);
  assert.match(source, /return result;/);
  assert.match(source, /allowMissing:!productionTranslationRequired/);
  assert.match(source, /routeComplete = translationResult\.missing\.length === 0/);
  assert.match(source, /STATIC_I18N_ROUTE_GAPS/);
  assert.doesNotMatch(source, /English generation skipped: release builds never call external translation providers/);
});

test('pricing H1 translation fragments remain canonical cached English', () => {
  const cache = JSON.parse(fs.readFileSync('config/bg-static-i18n-en.json','utf8'));
  assert.equal(cache['Prijzen voor'], 'Prices for');
  assert.equal(cache['digitalisering'], 'digitalization');
  assert.equal(cache['in het mkb'], 'in SMEs');
});
