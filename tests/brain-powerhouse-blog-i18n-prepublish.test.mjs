import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('publisher extracts cache only after all canonical SEO transformations', () => {
  const entry=fs.readFileSync(path.join(REPO,'tools/ci/netlify-build-entry.mjs'),'utf8');
  const publisher=fs.readFileSync(path.join(REPO,'.github/workflows/powerhouse-daily-blog.yml'),'utf8');
  const gate=fs.readFileSync(path.join(REPO,'.github/workflows/required-test.yml'),'utf8');
  assert.ok(entry.indexOf("'seo-apply'") < entry.indexOf("'localized-routes'"));
  assert.match(entry,/cacheOnlyPatch && name==='localized-routes'/);
  assert.match(entry,/NETLIFY_I18N_CACHE_PREPARED/);
  assert.match(publisher,/--prepare-i18n-cache="powerhouse-blog-\$DATE\.json"/);
  assert.match(publisher,/STATIC_I18N_REQUIRE_CACHE=1/);
  assert.match(publisher,/steps\.i18n\.outcome == 'success'/);
  assert.match(gate,/node --test tests\/brain-powerhouse-blog-i18n-prepublish\.test\.mjs/);
});

test('scoped patch cache is durable and complete before merge, not a global rewrite', () => {
  const source=fs.readFileSync(path.join(REPO,'tools/site-shell/build-localized-routes.mjs'),'utf8');
  assert.match(source,/const PREPARE_CACHE_ARG = process\.argv\.find/);
  assert.match(source,/if \(PREPARE_CACHE_PATCH_NAME\)/);
  assert.match(source,/Object\.fromEntries\(Object\.entries\(cache\)/);
  assert.match(source,/TRANSLATION_CACHE_PATCH_DIR,PREPARE_CACHE_PATCH_NAME/);
  assert.match(source,/STATIC_I18N_PREPARE_INCOMPLETE/);
  assert.match(source,/process\.exit\(0\)/);
});
