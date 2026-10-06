import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('Netlify production preview and fallback share one canonical build authority',async()=>{
  const [config,required,website,runner]=await Promise.all([
    read('netlify.toml'),
    read('.github/workflows/required-test.yml'),
    read('.github/workflows/lane-website.yml'),
    read('tools/ci/run-netlify-build.mjs'),
  ]);
  const configCalls=config.match(/command = "node tools\/ci\/run-netlify-build\.mjs"/g)||[];
  assert.equal(configCalls.length,2,'production and deploy-preview must use the same runner');
  assert.match(required,/Run exact Netlify production build command once[\s\S]*node tools\/ci\/run-netlify-build\.mjs/);
  assert.match(website,/Build exact local candidate only when reusable artifact is unavailable[\s\S]*node tools\/ci\/run-netlify-build\.mjs/);
  assert.doesNotMatch(required,/Run exact Netlify production build command once[\s\S]{0,5000}node tools\/bouw-v18-production\.mjs/);
  assert.match(runner,/NETLIFY_BUILD_PROFILE_V1/);
  assert.match(runner,/NETLIFY_BUILD_STEP_DONE/);
});

test('static locale build uses bounded deterministic route sharding',async()=>{
  const localized=await read('tools/site-shell/build-localized-routes.mjs');
  assert.match(localized,/STATIC_I18N_ROUTE_WORKERS/);
  assert.match(localized,/--route-shard=/);
  assert.match(localized,/Math\.min\(4,/);
  assert.match(localized,/await Promise\.all\(Array\.from\(\{length:routeWorkers\}/);
  assert.match(localized,/files\.filter\(\(_\,index\)=>index%shardTotal===shardIndex\)/);
});

test('Required publishes exact candidate build artifact and browser fallback reuses it',async()=>{
  const [required,website]=await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('.github/workflows/lane-website.yml'),
  ]);
  assert.match(required,/name: netlify-build-reuse-\$\{\{ needs\.preflight\.outputs\.candidate_sha \}\}/);
  assert.match(required,/NETLIFY_BUILD_REUSE_V1/);
  assert.match(required,/candidate_sha:process\.env\.CANDIDATE_SHA/);
  assert.match(website,/ARTIFACT_NAME: netlify-build-reuse-\$\{\{ inputs\.candidate_sha \}\}/);
  assert.match(website,/test "\$observed" = "\$EXPECTED_CANDIDATE_SHA"/);
  assert.match(website,/steps\.build-reuse\.outputs\.reused != 'true'/);
  assert.match(website,/actions:\s*read/);
});
