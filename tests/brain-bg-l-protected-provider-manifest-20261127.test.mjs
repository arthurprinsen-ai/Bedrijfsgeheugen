import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {declaredFunctions,resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';
test('existing bg-l native public redirect must be declared in protected Git deployment manifest',()=>{
 const cfg=readFileSync('supabase/config.toml','utf8');
 assert.equal(declaredFunctions(cfg).filter(x=>x==='bg-l').length,1);
 const section=cfg.split('[functions.bg-l]')[1].split(/\n\[/)[0];
 assert.match(section,/^enabled = true$/m);assert.match(section,/^verify_jwt = false$/m);assert.match(section,/^entrypoint = "\.\/functions\/bg-l\/index\.ts"$/m);
 const original=cfg.replace(/\n\[functions\.bg-l\][\s\S]*?(?=\n\[|$)/,'');
 assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/config.toml'],configText:cfg,baseConfigText:original}),['bg-l']);
});
