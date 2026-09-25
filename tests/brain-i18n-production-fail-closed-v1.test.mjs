import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');
const runtime=fs.readFileSync('assets/js/i18n.js','utf8');
const verifier=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production localized build is provider-independent and degrades to runtime translation when cache is incomplete',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"0"/);
  assert.match(source,/const cacheRequired = String\(process\.env\.STATIC_I18N_REQUIRE_CACHE/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/runtimeFallback:!translations/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(runtime,/\/api\/i18n-translate/);
});

test('deploy previews inherit the provider-independent fallback contract',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/\[context\.deploy-preview\][\s\S]*command\s*=/);
  assert.match(source,/data-bg-static-translated/);
});

test('English production success is still fail-closed at the browser proof layer',()=>{
  assert.ok(verifier.includes("switchPublicLocale(page, 'en', '/en/prijzen')"));
  assert.match(verifier,/page\.locator\('html'\)\.getAttribute\('lang'\)/);
  assert.match(verifier,/Pricing/);
});
