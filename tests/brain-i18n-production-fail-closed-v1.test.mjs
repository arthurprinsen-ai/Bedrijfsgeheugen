import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');
const productionVerifier=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('production localized build fails closed on incomplete immutable cache',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/if \(cacheRequired\) \{/);
});

test('deploy previews remain deterministic offline',()=>{
  assert.match(netlify,/\[context\.deploy-preview\.environment\][\s\S]*STATIC_I18N_NETWORK\s*=\s*"0"/);
});

test('production remains fail-closed at observable English browser proof',()=>{
  assert.match(productionVerifier,/waitForURL/);
  assert.match(productionVerifier,/data-bg-language-option="en"/);
  assert.match(productionVerifier,/English route did not render html lang=en/);
  assert.match(productionVerifier,/English route has no visible Pricing text/);
});
