import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production and deploy previews use deterministic cache-only static English', () => {
  const netlify=fs.readFileSync('netlify.toml','utf8');
  const localized=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  const buildEnvironment=netlify.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  assert.match(buildEnvironment,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(buildEnvironment,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
  assert.match(netlify,/\[context\.deploy-preview\][\s\S]*command\s*=/);
  assert.match(localized,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(localized,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(localized,/STATIC_I18N_REQUIRE_CACHE/);
  assert.match(localized,/cacheRequired/);
});
