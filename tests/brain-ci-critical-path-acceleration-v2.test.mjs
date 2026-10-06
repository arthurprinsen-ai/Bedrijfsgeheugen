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
  const [gate,operational,shadow,canary,codeql,supabase]=await Promise.all([
    readFile('.github/workflows/repo-writer-gate-dispatch.yml','utf8'),
    readFile('.github/workflows/repo-writer-operational-verification.yml','utf8'),
    readFile('.github/workflows/repo-writer-candidate-shadow.yml','utf8'),
    readFile('.github/workflows/repo-writer-cheap-canary.yml','utf8'),
    readFile('.github/workflows/powerhouse-codeql.yml','utf8'),
    readFile('.github/workflows/supabase-preview-applicability.yml','utf8'),
  ]);
  assert.match(gate,/group: repo-writer-gates-\$\{\{ inputs\.pr_number \}\}[\s\S]*cancel-in-progress: true/);
  assert.match(operational,/group: repo-writer-operational-[\s\S]*cancel-in-progress: true/);
  assert.match(shadow,/group: repo-writer-candidate-shadow-[\s\S]*cancel-in-progress: true/);
  assert.match(canary,/group: repo-writer-cheap-canary-[\s\S]*cancel-in-progress: true/);
  assert.match(codeql,/CodeQL scope[\s\S]*pulls\/\$PR_NUMBER\/files[\s\S]*needs: scope[\s\S]*needs\.scope\.outputs\.run_codeql == 'true'/);
  assert.match(supabase,/Fast-path Supabase applicability[\s\S]*pulls\/\$PR_NUMBER\/files[\s\S]*checkout@v5[\s\S]*supabase_changed == 'true'/);
});

test('Supabase non-applicable fast path is a valid multiline shell step',async()=>{
  const workflow=await readFile('.github/workflows/supabase-preview-applicability.yml','utf8');
  assert.match(workflow,/Record provider preview not applicable without checkout[\s\S]*run: \|[\s\S]*SUPABASE_PREVIEW_NOT_APPLICABLE/);
  assert.doesNotMatch(workflow,/run: echo "SUPABASE_PREVIEW_NOT_APPLICABLE[^\n]*#/);
});
