import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {declaredFunctions,resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';

const config=readFileSync('supabase/config.toml','utf8');
test('both existing daily blog functions are registered exactly once in canonical config',()=>{
 for(const fn of ['powerhouse-blog-export','powerhouse-blog-queue']){
  assert.equal((config.match(new RegExp('\\[functions\\.'+fn+'\\]','g'))||[]).length,1);
  const section=config.split('[functions.'+fn+']')[1].split(/\n\s*\[functions\./)[0];
  assert.match(section,/enabled\s*=\s*true/);
  assert.match(section,/verify_jwt\s*=\s*false/);
  assert.ok(section.includes('entrypoint = "./functions/'+fn+'/index.ts"'));
  assert.ok(readFileSync('supabase/functions/'+fn+'/index.ts','utf8').length>100);
 }
 assert.ok(declaredFunctions(config).includes('powerhouse-blog-export'));
 assert.ok(declaredFunctions(config).includes('powerhouse-blog-queue'));
});
test('both new registrations are resolved as exact provider-attestation scope',()=>{
 const base=config.replace(/\n# The approved daily blog exporter[\s\S]*$/,'');
 assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/config.toml'],configText:config,baseConfigText:base}),['powerhouse-blog-export','powerhouse-blog-queue']);
});
test('queue retains internal scheduler secret gate; export remains read-only',()=>{
 const q=readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
 const e=readFileSync('supabase/functions/powerhouse-blog-export/index.ts','utf8');
 assert.match(q,/req\.headers\.get\('x-powerhouse-token'\)/);
 assert.match(q,/bg_geheim/);
 assert.match(e,/function evidenceObject|const slugify/);
 assert.match(q,/originalBlogSlugGuard/);
});
