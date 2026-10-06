import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canSkipNetlifyBuild,isNetlifyBuildIrrelevantPath,netlifyIgnoreDecision} from '../tools/netlify-ignore-build.mjs';

test('Netlify skips only a complete set of proven non-Netlify paths',()=>{
  assert.equal(canSkipNetlifyBuild(['.github/workflows/a.yml','docs/changes/a.md','tests/a.test.mjs','supabase/functions/a/index.ts','brain/learning/a.json']),true);
  assert.equal(canSkipNetlifyBuild(['docs/changes/a.md','netlify/functions/a.mjs']),false);
  assert.equal(canSkipNetlifyBuild(['docs/changes/a.md','blog/a/index.html']),false);
  assert.equal(canSkipNetlifyBuild([]),false);
});
test('Netlify build impact classification fails closed for hosted runtime or unknown paths',()=>{
  for(const path of ['netlify/functions/connector-readiness.mjs','platform/api/a.mjs','site/website-release-risk.json','blog/a/index.html','tools/site-shell/build-localized-routes.mjs','brain/adapters/notion-company-writer.mjs','config/bg-static-i18n-en.d/a.json']){
    assert.equal(isNetlifyBuildIrrelevantPath(path),false,path);
  }
});
test('Netlify ignore decision fails open without immutable refs or when git diff fails',()=>{
  assert.equal(netlifyIgnoreDecision({},{}).skip,false);
  const env={CACHED_COMMIT_REF:'a'.repeat(40),COMMIT_REF:'b'.repeat(40)};
  const failed=netlifyIgnoreDecision(env,{execFile(){throw new Error('missing commit')}});
  assert.equal(failed.skip,false);
  assert.equal(failed.reason,'git-diff-failed');
});
test('Netlify ignore decision skips docs-only immutable diff and builds mixed diff',()=>{
  const env={CACHED_COMMIT_REF:'a'.repeat(40),COMMIT_REF:'b'.repeat(40)};
  assert.equal(netlifyIgnoreDecision(env,{execFile(){return 'docs/changes/a.md\n.github/workflows/a.yml\n'}}).skip,true);
  assert.equal(netlifyIgnoreDecision(env,{execFile(){return 'docs/changes/a.md\nnetlify/functions/a.mjs\n'}}).skip,false);
});
test('critical-path workflows keep visible checks while eliminating stale work',async()=>{
  const [netlify,shadow,canary,codeql,supabase]=await Promise.all([
    readFile('netlify.toml','utf8'),
    readFile('.github/workflows/repo-writer-candidate-shadow.yml','utf8'),
    readFile('.github/workflows/repo-writer-cheap-canary.yml','utf8'),
    readFile('.github/workflows/powerhouse-codeql.yml','utf8'),
    readFile('.github/workflows/supabase-preview-applicability.yml','utf8'),
  ]);
  assert.match(netlify,/ignore = "node tools\/netlify-ignore-build\.mjs"/);
  assert.match(shadow,/group: repo-writer-candidate-shadow-[\s\S]*cancel-in-progress: true/);
  assert.match(canary,/group: repo-writer-cheap-canary-[\s\S]*cancel-in-progress: true/);
  assert.match(codeql,/CodeQL scope[\s\S]*pulls\/\$PR_NUMBER\/files[\s\S]*needs: scope[\s\S]*needs\.scope\.outputs\.run_codeql == 'true'/);
  assert.match(supabase,/Fast-path Supabase applicability[\s\S]*pulls\/\$PR_NUMBER\/files[\s\S]*checkout@v5[\s\S]*supabase_changed == 'true'/);
});
