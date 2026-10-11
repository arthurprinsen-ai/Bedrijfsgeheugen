import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/required-test.yml','utf8');
const entry=readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
test('protected i18n validation uses the same production site transforms as the daily publisher',()=>{
  const start=workflow.indexOf('name: Validate fail-closed static English cache before merge');
  const end=workflow.indexOf('- name: Verify previously unwired test contracts',start);
  assert.ok(start>=0 && end>start);
  const content=workflow.slice(start,end);
  assert.match(content,/STATIC_I18N_REQUIRE_CACHE: '1'/);
  assert.match(content,/STATIC_I18N_NETWORK: '0'/);
  const prepare=content.indexOf('node tools/ci/netlify-build-entry.mjs --prepare-i18n-cache=ci-static-i18n-verification.json');
  const validate=content.indexOf('node tools/site-shell/build-localized-routes.mjs --validate-cache');
  assert.ok(prepare>=0 && validate>prepare);
});
test('prebuild includes SEO/UI transforms before localized routes and never commits generated output',()=>{
  const seo=entry.indexOf("'seo-apply'");
  const localized=entry.indexOf("'localized-routes'");
  assert.ok(seo>0 && localized>seo);
  assert.match(entry,/if\(cacheOnlyPatch && name==='localized-routes'\)/);
  assert.doesNotMatch(workflow,/STATIC_I18N_REQUIRE_CACHE: '0'/);
});
