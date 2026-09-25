import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
const oldContract=fs.readFileSync('tests/brain-i18n-production-fail-closed-v1.test.mjs','utf8');

test('provider availability can no longer become production publication authority',()=>{
  assert.match(source,/STATIC_I18N_PROVIDER_FALLBACK/);
  assert.doesNotMatch(source,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.doesNotMatch(source,/STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source,/runtimeFallback:!translations/);
  assert.doesNotMatch(oldContract,/assert\.match\(source,\/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(oldContract,/production remains fail-closed at observable English browser proof/);
});
