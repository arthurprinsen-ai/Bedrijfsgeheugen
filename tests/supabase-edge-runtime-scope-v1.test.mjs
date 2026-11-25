import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { declaredFunctions, resolveEdgeRuntimeFunctions } from '../tools/supabase/edge-runtime-scope.mjs';

const config=readFileSync('supabase/config.toml','utf8');
test('predictive transport changes also attest its calibration consumer',()=>{
 assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/functions/powerhouse-predictive-engine/openai-forecast.mjs'],configText:config}),['powerhouse-forecast-calibrator','powerhouse-predictive-engine']);
});

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

test('shared changes never hide an explicitly edited undeclared function',()=>{
  assert.deepEqual(resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/functions/_shared/example.mjs','supabase/functions/unregistered-proof/index.ts'],
    configText:'[functions.existing]\nenabled = true\n'
  }),['existing','unregistered-proof']);
});

test('existing Mira router and both proof stages participate in protected production delivery',()=>{
  const declared=declaredFunctions(config);
  for(const name of ['powerhouse-instagram-media-router','powerhouse-instagram-media-verifier','powerhouse-instagram-temporal-verifier'])
    assert.ok(declared.includes(name),`production delivery excludes ${name}`);
});
