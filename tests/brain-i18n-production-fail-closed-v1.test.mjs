import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');
const productionVerifier=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production localized build may degrade to runtime translation when provider fails',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.doesNotMatch(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.doesNotMatch(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
  assert.match(source,/runtimeFallback:!translations/);
});

test('deploy previews may remain offline without pretending to be translated',()=>{
  assert.match(netlify,/\[context\.deploy-preview\.environment\][\s\S]*STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(source,/data-bg-static-translated/);
});

test('production remains fail-closed at observable English browser proof',()=>{
  assert.match(productionVerifier,/\/en\/prijzen/);
  assert.match(productionVerifier,/html.*lang|documentElement\.lang|lang=/i);
  assert.match(productionVerifier,/Pricing|pricing/);
});
