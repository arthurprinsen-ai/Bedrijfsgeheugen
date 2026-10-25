import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {declaredFunctions,resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';
const config=fs.readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
const store=fs.readFileSync(new URL('../supabase/functions/social-learning-store/index.ts',import.meta.url),'utf8');
test('existing social learning Edge store is declared exactly once in canonical protected deployment scope',()=>{
 assert.equal(config.split('[functions.social-learning-store]').length-1,1);
 assert.ok(declaredFunctions(config).includes('social-learning-store'));
 assert.ok(config.includes('entrypoint = "./functions/social-learning-store/index.ts"'));
});
test('preserves deployed non-JWT mode only because original service token is cryptographically checked',()=>{
 const part=config.split('[functions.social-learning-store]')[1].split(/\n\[/)[0];
 assert.match(part,/verify_jwt\s*=\s*false/);
 assert.ok(store.includes("req.headers.get('x-bg-service-token')"));
 assert.ok(store.includes("sha256("));
 assert.ok(store.includes("return json({error:'UNAUTHORIZED'},401)"));
});
test('canonical production authority resolves only newly declared social-learning-store on config section change',()=>{
 const before=config.slice(0,config.indexOf('\n[functions.social-learning-store]'));
 const files=resolveEdgeRuntimeFunctions({
   changedPaths:['supabase/config.toml'],configText:config,baseConfigText:before
 });
 assert.deepEqual(files,['social-learning-store']);
});
test('direct future social-learning-store source change must always be published in existing scope',()=>{
 const changes=resolveEdgeRuntimeFunctions({changedPaths:['supabase/functions/social-learning-store/index.ts'],configText:config});
 assert.deepEqual(changes,['social-learning-store']);
});
