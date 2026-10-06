import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('Netlify build has one canonical command authority',async()=>{
  const [toml,entry]=await Promise.all([read('netlify.toml'),read('tools/ci/netlify-build-entry.mjs')]);
  const blocks=[
    toml.match(/\[build\]\n([\s\S]*?)(?=\n\[)/)?.[1]||'',
    toml.match(/\[context\.deploy-preview\]\n([\s\S]*?)(?=\n\[)/)?.[1]||'',
  ];
  for(const block of blocks) assert.match(block,/command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"/);
  assert.ok(entry.indexOf("'v18-production'")<entry.indexOf("'tabbladen'"));
  assert.match(entry,/NETLIFY_BUILD_PROFILE_V1/);
  assert.match(entry,/NETLIFY_PREBUILT_REUSE/);
});

test('Required builds once and publishes immutable tree-addressed artifact',async()=>{
  const workflow=await read('.github/workflows/required-test.yml');
  assert.match(workflow,/node tools\/ci\/netlify-build-entry\.mjs/);
  assert.match(workflow,/git rev-parse "\$\{CANDIDATE_SHA\}\^\{tree\}"/);
  assert.match(workflow,/netlify-prebuilt-tree-\$\{\{ steps\.prebuilt\.outputs\.source_tree_sha \}\}/);
  assert.match(workflow,/NETLIFY_PREBUILT_ARTIFACT_V1/);
  assert.match(workflow,/STATIC_I18N_BUILD_CACHE_DIR:\s*\.cache\/bg-static-i18n-v1/);
  assert.match(workflow,/static-i18n-render-v1-\$\{\{ runner\.os \}\}-\$\{\{ github\.run_id \}\}/);
});

test('production reuses only verified successful Required artifact and retains full-build fallback',async()=>{
  const workflow=await read('.github/workflows/production-source-snapshot.yml');
  assert.match(workflow,/actions:\s*read/);
  assert.match(workflow,/netlify-prebuilt-tree-\$\{source_tree_sha\}/);
  assert.match(workflow,/run_name.*Required test/s);
  assert.match(workflow,/run_conclusion.*success/s);
  assert.match(workflow,/head_repository.*GITHUB_REPOSITORY/s);
  assert.match(workflow,/sha256sum/);
  assert.match(workflow,/PREBUILT_REUSE/);
  assert.match(workflow,/PREBUILT_DIR/);
  assert.match(workflow,/NETLIFY_PREBUILT_ARTIFACT_REUSE/);
  assert.match(workflow,/PREBUILT_REUSE.*!=.*true/s);
  assert.match(workflow,/cd "\$PREBUILT_DIR"/);
});

test('prebuilt deployment only restamps release identity',async()=>{
  const [entry,restamp]=await Promise.all([
    read('tools/ci/netlify-build-entry.mjs'),
    read('tools/site-shell/restamp-release-identity.mjs')
  ]);
  assert.match(entry,/restampReleaseIdentity/);
  assert.match(restamp,/ensureReleaseMarker/);
  assert.match(restamp,/BRAIN-DELIVERY-v2/);
  assert.doesNotMatch(restamp,/applyCanonicalShell|build-localized-routes|seo-order-engine/);
});

test('static locale rendering uses content-addressed persistent cache',async()=>{
  const builder=await read('tools/site-shell/build-localized-routes.mjs');
  assert.match(builder,/STATIC_I18N_BUILD_CACHE_DIR/);
  assert.match(builder,/NETLIFY_CACHE_DIR/);
  assert.match(builder,/createHash\('sha256'\)/);
  assert.match(builder,/cacheHits/);
  assert.match(builder,/cacheMisses/);
  assert.match(builder,/bg-release-commit/);
  assert.match(builder,/STATIC_I18N_ROUTE_WORKERS/);
  assert.match(builder,/STATIC_I18N_PARALLEL_START/);
  assert.match(builder,/Math\.min\(4/);
  assert.match(builder,/STATIC_I18N_SHARD_NETWORK_FORBIDDEN/);
});

test('tabbladen regression is classified with its website implementation',async()=>{
  const policy=JSON.parse(await read('config/brain-delivery-system.json'));
  const website=policy.lanes.find(lane=>lane.id==='website');
  assert.ok(website);
  assert.ok(website.paths.includes('tools/apply-tabbladen.mjs'));
  assert.ok(website.paths.includes('tests/tabbladen.test.mjs'));
});
