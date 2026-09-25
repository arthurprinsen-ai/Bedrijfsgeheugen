import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const netlify = fs.readFileSync('netlify.toml','utf8');

test('production static i18n remains fail closed and never publishes Dutch as English', () => {
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(source,/provider_body/);
  assert.match(source,/if \(!transient && status >= 400 && status < 500\) break/);
});

test('Netlify validates the versioned cache after all pre-i18n build transforms', () => {
  const occurrences = (netlify.match(/build-localized-routes\.mjs --validate-cache/g) || []).length;
  assert.ok(occurrences >= 2, 'production and deploy-preview chains must validate post-transform cache coverage');
  assert.match(netlify,/apply-i18n\.mjs && node tools\/site-shell\/build-localized-routes\.mjs --validate-cache && node tools\/site-shell\/build-localized-routes\.mjs/);
});
