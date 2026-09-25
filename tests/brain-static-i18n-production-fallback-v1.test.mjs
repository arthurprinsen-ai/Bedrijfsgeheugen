import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static i18n fallback keeps cached English and uses runtime only for uncached strings', () => {
  const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.match(source,/STATIC_I18N_OFFLINE_RELEASE applying cached English/);
  assert.match(source,/return \{ map:result, complete:false, missing:\[\.\.\.missing\] \}/);
  assert.match(source,/applyTranslations\(enRefs,translations,\{allowMissing:translationState\?\.complete !== true\}\)/);
  assert.match(source,/runtimeFallback:translationState\?\.complete !== true/);
});
