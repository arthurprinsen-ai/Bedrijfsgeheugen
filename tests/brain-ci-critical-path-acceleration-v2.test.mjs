import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('existing Netlify build suppression remains single-source and fail-open',async()=>{
  const [config,ignore]=await Promise.all([
    readFile('netlify.toml','utf8'),
    readFile('tools/ci/netlify-ignore-build.mjs','utf8'),
  ]);
  assert.match(config,/ignore = "node \.\/tools\/ci\/netlify-ignore-build\.mjs"/);
  assert.equal((config.match(/^\s*ignore\s*=/gm)||[]).length,1);
  assert.match(ignore,/NETLIFY_BUILD_REQUIRED/);
  assert.match(ignore,/process\.exit\(1\)/);
  assert.match(ignore,/git', \['diff', '--name-only'/);
});

test('critical-path workflows keep visible checks while eliminating stale work',async()=>{
  const [gate,operational,shadow,canary,codeql,required]=await Promise.all([
    readFile('.github/workflows/repo-writer-gate-dispatch.yml','utf8'),
    readFile('.github/workflows/repo-writer-operational-verification.yml','utf8'),
    readFile('.github/workflows/repo-writer-candidate-shadow.yml','utf8'),
    readFile('.github/workflows/repo-writer-cheap-canary.yml','utf8'),
    readFile('.github/workflows/codeql.yml','utf8'),
    readFile('.github/workflows/required-test.yml','utf8'),
  ]);
  assert.match(gate,/group: repo-writer-gates-\$\{\{ inputs\.pr_number \}\}[\s\S]*cancel-in-progress: true/);
  assert.match(operational,/group: repo-writer-operational-[\s\S]*cancel-in-progress: true/);
  assert.match(shadow,/group: repo-writer-candidate-shadow-[\s\S]*cancel-in-progress: true/);
  assert.match(canary,/group: repo-writer-cheap-canary-[\s\S]*cancel-in-progress: true/);
  assert.match(codeql,/name: Powerhouse CodeQL/);
  assert.match(codeql,/pull_request:[\s\S]*merge_group:[\s\S]*push:/);
  assert.match(codeql,/merge_group:[\s\S]*types: \[checks_requested\]/);
  assert.match(codeql,/javascript-typescript, python/);
  assert.match(codeql,/queries: security-extended/);
  assert.match(codeql,/Upload CodeQL SARIF evidence/);
  assert.match(codeql,/group: powerhouse-codeql-/);
  assert.match(codeql,/cancel-in-progress: true/);
  assert.match(required,/supabase_preview_required[\s\S]*Verify provider-owned Supabase Preview on exact candidate head/);
});

test('Supabase applicability is owned by Required test without a standalone PR runner',async()=>{
  const required=await readFile('.github/workflows/required-test.yml','utf8');
  assert.match(required,/supabase_preview_required/);
  assert.match(required,/^  supabase_preview:/m);
  assert.match(required,/SUPABASE_PREVIEW_PROVIDER_VERIFIED/);
  await assert.rejects(
    () => readFile('.github/workflows/supabase-preview-applicability.yml','utf8'),
    error => error?.code === 'ENOENT'
  );
});
