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

test('production transforms run in a disposable checkout so unrelated source-contract tests see original files',()=>{
  const start=workflow.indexOf('name: Validate fail-closed static English cache before merge');
  const end=workflow.indexOf('- name: Verify previously unwired test contracts',start);
  const content=workflow.slice(start,end);
  assert.match(content,/git worktree add --detach "\$worktree" HEAD/);
  assert.match(content,/ln -s "\$GITHUB_WORKSPACE\/node_modules" "\$worktree\/node_modules"/);
  assert.match(content,/cd "\$worktree"/);
  assert.match(content,/git worktree remove --force/);
  assert.ok(content.indexOf('git worktree add --detach') < content.indexOf('node tools\/ci\/netlify-build-entry.mjs'));
});

test('the original fail-closed runtime and English cache tests remain mandatory',()=>{
  const start=workflow.indexOf('name: Validate fail-closed static English cache before merge');
  const end=workflow.indexOf('- name: Verify previously unwired test contracts',start);
  const content=workflow.slice(start,end);
  assert.match(content,/POWERHOUSE_I18N_REQUIRE_RUNTIME=1 node --test/);
  assert.match(content,/tests\/brain-powerhouse-blog-i18n-prepublish\.test\.mjs/);
  assert.match(content,/tests\/delivery-powerhouse-blog-i18n-prepublish\.integration\.test\.mjs/);
  assert.match(content,/STATIC_I18N_NETWORK: '0'/);
  assert.match(content,/STATIC_I18N_REQUIRE_CACHE: '1'/);
});

test('advanced PR base is accepted only after protected ancestry and exact candidate history proof',()=>{
  const start=workflow.indexOf("const metadataAuthority=resolveDeliveryMetadataAuthority");
  const end=workflow.indexOf("const changedPaths=execFileSync('git'",start);
  assert.ok(start>=0 && end>start);
  const code=workflow.slice(start,end);
  assert.match(code,/metadataAuthority\.source === 'pr-body'/);
  assert.match(code,/PR_DECLARED_BASE_INVALID/);
  assert.match(code,/PR_BASE_NOT_DESCENDANT_OF_EVENT/);
  assert.match(code,/PR_BASE_NOT_IN_PROTECTED_MAIN/);
  assert.match(code,/PR_BASE_NOT_IN_CANDIDATE_HISTORY/);
  assert.match(code,/merge-base','--is-ancestor'/);
  assert.match(code,/comparisonBaseSha=declared/);
  assert.match(code,/metadataAuthority\.source === 'versioned-manifest'/);
});
