import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production static English build cannot silently publish Dutch copies', () => {
  const netlify = fs.readFileSync('netlify.toml','utf8');
  const builder = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');

  assert.match(netlify, /STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(builder, /STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(builder, /STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(builder, /STATIC_I18N_OFFLINE_RELEASE/);
});
