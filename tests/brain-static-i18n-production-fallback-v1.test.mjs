import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static i18n provider failure falls back to runtime translation without failing build', () => {
  const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.match(source,/try \{[\s\S]*Promise\.all[\s\S]*return result;[\s\S]*\} catch \(error\) \{[\s\S]*return null;[\s\S]*\}/);
  assert.match(source,/runtimeFallback:!translations/);
});
