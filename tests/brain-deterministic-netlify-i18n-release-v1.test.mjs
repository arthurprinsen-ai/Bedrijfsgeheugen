import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production English fails closed while deploy previews stay provider-independent', () => {
  const netlify=fs.readFileSync('netlify.toml','utf8');
  const localized=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  const runtime=fs.readFileSync('assets/js/i18n.js','utf8');

  const buildEnvironment=netlify.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  const previewEnvironment=netlify.match(/\[context\.deploy-preview\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';

  assert.match(buildEnvironment,/STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(buildEnvironment,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"0"/);
  assert.match(previewEnvironment,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(localized,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(localized,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(localized,/runtimeFallback:!translations/);
  assert.match(runtime,/\/api\/i18n-translate/);
});
