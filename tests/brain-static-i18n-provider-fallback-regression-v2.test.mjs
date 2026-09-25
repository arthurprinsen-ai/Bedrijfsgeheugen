import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify = fs.readFileSync('netlify.toml','utf8');

test('production static i18n is cache-only and fails closed instead of publishing Dutch as English', () => {
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(source,/runtimeFallback:!translations/);
});
