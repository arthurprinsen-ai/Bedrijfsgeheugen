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
  // The original blog exporter is service-only (Supabase provider v297: JWT on);
  // the internal blog queue uses its existing scheduler-token gate (JWT off).
  // Never weaken the live export JWT gate to satisfy an obsolete fixture.
  const jwtLines=[...section.matchAll(/^\s*verify_jwt\s*=\s*(true|false)\s*$/gm)];
  assert.equal(jwtLines.length,1,'exactly one platform JWT declaration per function');
  assert.equal(jwtLines[0][1],fn==='powerhouse-blog-export'?'true':'false');
  assert.ok(section.includes('entrypoint = "./functions/'+fn+'/index.ts"'));
  assert.ok(readFileSync('supabase/functions/'+fn+'/index.ts','utf8').length>100);
 }
 assert.ok(declaredFunctions(config).includes('powerhouse-blog-export'));
 assert.ok(declaredFunctions(config).includes('powerhouse-blog-queue'));
});
test('both new registrations are resolved as exact provider-attestation scope',()=>{
 const base=config.replace(/\[functions\.powerhouse-blog-export\][\s\S]*?(?=\[functions\.powerhouse-predictive-engine\])/,'');
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

test('blog export requires both provider JWT and existing service-only approval guards',()=>{
 const exporter=config.split('[functions.powerhouse-blog-export]')[1].split(/\n\s*\[functions\./)[0];
 assert.match(exporter,/verify_jwt\s*=\s*true/);
 const code=readFileSync('supabase/functions/powerhouse-blog-export/index.ts','utf8');
 assert.match(code,/req\.headers\.get\('authorization'\)/);
 assert.match(code,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(code,/EXPORT_AUTH_REQUIRED/);
 assert.match(code,/!o\?\.approved_at/);
 assert.match(code,/BLOG_PUBLIC_EXPORT_NOT_APPROVED/);
 assert.ok(code.indexOf('EXPORT_AUTH_REQUIRED')<code.indexOf('createClient(url,key'));
 assert.ok(code.indexOf('BLOG_PUBLIC_EXPORT_NOT_APPROVED')<code.indexOf('title:clean(a.title)'));
});
