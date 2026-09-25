import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production cannot silently publish Dutch copies under /en', () => {
  const netlify = fs.readFileSync('netlify.toml','utf8');
  const builder = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  const production = netlify.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  const preview = netlify.match(/\[context\.deploy-preview\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  assert.match(production,/STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(preview,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(builder,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(builder,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
});
