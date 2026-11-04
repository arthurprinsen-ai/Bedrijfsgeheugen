import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflow=await readFile(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const sourceFence=workflow.split('Verify published SHA override is strictly scoped to CI and evidence')[1]?.split('Classify visual baseline impact fail-closed')[0]||'';

test('original production browser may read the same exact immutable deploy after nonruntime AGENTS/skill/test-only updates',()=>{
 assert.ok(sourceFence,'original trusted exact-SHA fence must remain');
 assert.match(sourceFence,/git merge-base --is-ancestor "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(sourceFence,/AGENTS\.md\|\.agents\/skills\/\*/);
 assert.match(sourceFence,/tests\/\*\|docs\/\*\|brain\/learning\/\*/);
 assert.match(sourceFence,/Source.*changed.*after.*selected.*production.*SHA|Runtime source changed after selected production SHA/);
 assert.match(sourceFence,/Production SHA override requires main workflow_dispatch/);
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
