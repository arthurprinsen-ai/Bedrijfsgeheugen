import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');
const runtime=fs.readFileSync('assets/js/i18n.js','utf8');
const verifier=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production localized build fails closed instead of publishing Dutch copies under /en',()=>{
  const buildEnvironment=netlify.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  assert.match(buildEnvironment,/STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(source,/const cacheRequired = String\(process\.env\.STATIC_I18N_REQUIRE_CACHE/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(runtime,/\/api\/i18n-translate/);
});

test('deploy previews remain provider-independent',()=>{
  const previewEnvironment=netlify.match(/\[context\.deploy-preview\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  assert.match(previewEnvironment,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/\[context\.deploy-preview\][\s\S]*command\s*=/);
  assert.match(source,/data-bg-static-translated/);
});

test('English production success is fail-closed at the browser proof layer',()=>{
  assert.match(verifier,/async function switchPublicLocale/);
  assert.match(verifier,/page\.locator\('html'\)\.getAttribute\('lang'\)/);
  assert.match(verifier,/English route still shows the Dutch pricing H1/);
  assert.match(verifier,/English route has no visible Pricing text/);
});
