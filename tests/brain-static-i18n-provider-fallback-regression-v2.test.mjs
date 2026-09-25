import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify = fs.readFileSync('netlify.toml','utf8');

test('normal production no longer depends on the external translation provider', () => {
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"0"/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/STATIC_I18N_PROVIDER_ERROR/);
  assert.match(source,/if \(!transient && status >= 400 && status < 500\) break/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
});
