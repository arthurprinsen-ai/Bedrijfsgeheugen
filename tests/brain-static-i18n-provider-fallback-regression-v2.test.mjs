import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify = fs.readFileSync('netlify.toml','utf8');
const runtime = fs.readFileSync('assets/js/i18n.js','utf8');

test('normal production is provider-independent and requires a complete static English cache', () => {
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/STATIC_I18N_PROVIDER_ERROR/);
  assert.match(source,/if \(!transient && status >= 400 && status < 500\) break/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(runtime,/\/api\/i18n-translate/);
});
