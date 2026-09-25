import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Netlify production requires a complete immutable English cache', () => {
  const toml = fs.readFileSync('netlify.toml','utf8');
  assert.match(toml,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(toml,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
});

test('localized build fails instead of emitting untranslated English routes', () => {
  const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/const cacheRequired = String\(process\.env\.STATIC_I18N_REQUIRE_CACHE/);
});
