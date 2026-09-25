import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');

test('production static i18n provider failure is fail closed while offline release may use runtime fallback', () => {
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/provider_body/);
  assert.match(source,/if \(!transient && status >= 400 && status < 500\) break/);
  assert.match(source,/if \(networkAllowed\) \{\s*throw new Error\('STATIC_I18N_PRODUCTION_TRANSLATION_FAILED:/s);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(source,/runtimeFallback:!translations/);
});
