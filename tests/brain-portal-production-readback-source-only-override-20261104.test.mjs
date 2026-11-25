import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflow=await readFile(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const sourceFence=workflow.split('Verify published SHA override is strictly scoped to CI and evidence')[1]?.split('Classify visual baseline impact fail-closed')[0]||'';

test('original production browser may read the same exact immutable deploy after nonruntime AGENTS/skill/test-only updates',()=>{
 assert.ok(sourceFence,'original trusted exact-SHA fence must remain');
 assert.match(sourceFence,/git merge-base --is-ancestor "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(sourceFence,/AGENTS\.md\|\.agents\/skills\/\*/);
 // Source allowlist gained exact non-Netlify Edge and GitHub observer paths;
 // path adjacency was never a security property. Assert individual exact
 // names in the executable original case arm instead.
 const scope=sourceFence.match(/case "\$file" in\s*([^\n]+)\s*;;/)?.[1]||'';
 for(const exact of [
  '.agents/skills/*','supabase/migration-history.lock.json',
  'tools/delivery/github-actions-failure-observer.mjs',
  'supabase/functions/_shared/editorial-council-context.mjs',
  'supabase/functions/powerhouse-content-loop/index.ts',
  'supabase/functions/powerhouse-social-publisher/index.ts'
 ])assert.ok(scope.split('|').includes(exact),'original strict readback scope must explicitly include '+exact);
 assert.ok(!scope.includes('supabase/functions/*'),'never weaken the guard to all Edge functions');
 assert.match(sourceFence,/tests\/\*\|docs\/\*\|brain\/learning\/\*/);
 assert.match(sourceFence,/Source.*changed.*after.*selected.*production.*SHA|Runtime source changed after selected production SHA/);
 assert.match(sourceFence,/Published source SHA pin requires approved main workflow_dispatch or original evidence-only push/);
 assert.match(sourceFence,/PORTAL_PUBLISHED_CI_ONLY_VERIFIED:-false/);
});

test('source-only readback never whitelists changed live portal code, credentials or security policy',()=>{
 const allowed=sourceFence.match(/case "\$file" in\s*([^\n]+)\s*;;/);
 assert.ok(allowed,'derive effective allowlist from original executable case branch');
 const glob=allowed[1];
 for(const disallowed of ['portal-v2/app.js','portal-v2/modules/overview.js','netlify/functions/portal-tenant-data.js','supabase/migrations/20261104090000_sensitive.sql','.env']){
   assert.doesNotMatch(disallowed,new RegExp('^('+glob.split('|').map(piece=>piece.trim().replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')).join('|')+')$'),disallowed+' must require deployed exact SHA');
 }
 assert.match(sourceFence,/exit 1/);
});
