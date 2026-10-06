import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { declaredFunctions, resolveEdgeRuntimeFunctions } from '../tools/supabase/edge-runtime-scope.mjs';

const config=readFileSync('supabase/config.toml','utf8');

test('shared and config changes expand to declared functions',()=>{
  const declared=declaredFunctions(config);
  assert.ok(declared.length>0);
  assert.deepEqual(resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/functions/_shared/powerhouse-scheduler-auth.ts'],
    configText:config
  }),declared);
  assert.deepEqual(resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/config.toml'],
    configText:config
  }),declared);
  assert.equal(declared.includes('_shared'),false);
});

test('direct function change stays narrow',()=>{
  assert.deepEqual(resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/functions/powerhouse-predictive-engine/index.ts'],
    configText:config
  }),['powerhouse-predictive-engine']);
});
