import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');

test('production localized build is provider-independent and uses cache deterministically but closes on production browser proof',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"0"/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/const cacheRequired = String\(process\.env\.STATIC_I18N_REQUIRE_CACHE/);
  assert.match(source,/if \(cacheRequired\) \{/);
  assert.match(source,/STATIC_I18N_CACHE_MISSING/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
});

test('deploy previews inherit the deterministic cache-only contract',()=>{
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"0"/);
  assert.match(netlify,/\[context\.deploy-preview\][\s\S]*command\s*=/);
  assert.match(source,/data-bg-static-translated/);
});

test('English artifacts may fall back to runtime translation but remain visibly marked for runtime takeover',()=>{
  assert.match(source,/runtimeFallback:!translations/);
  assert.match(source,/setLocaleMetadata\(enDoc,'en',route,Boolean\(translations\)\)/);
});
