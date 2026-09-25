import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');

test('production static i18n keeps runtime fallback for recoverable failures but fails non-transient provider errors immediately', () => {
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.doesNotMatch(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.doesNotMatch(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/provider_body/);
  assert.match(source,/if \(!transient && status >= 400 && status < 500\) break/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(source,/runtimeFallback:!translations/);
});
