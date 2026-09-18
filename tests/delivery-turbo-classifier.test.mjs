import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTurboDelivery } from '../tools/delivery/turbo-classifier.mjs';

test('bounded application change is TURBO',()=>{
  const r=classifyTurboDelivery({changedPaths:['portal-v2/card.js','tests/portal-card.test.mjs']});
  assert.equal(r.turbo,true);
  assert.equal(r.class,'TURBO');
});
test('workflow change is never TURBO',()=>{
  const r=classifyTurboDelivery({changedPaths:['.github/workflows/required-test.yml']});
  assert.equal(r.turbo,false);
});
test('migration and security changes are never TURBO',()=>{
  assert.equal(classifyTurboDelivery({changedPaths:['supabase/migrations/x.sql']}).turbo,false);
  assert.equal(classifyTurboDelivery({changedPaths:['netlify/functions/auth-login.mjs']}).turbo,false);
});
test('wide change is STANDARD',()=>{
  const changedPaths=Array.from({length:13},(_,i)=>`portal-v2/f${i}.js`);
  assert.equal(classifyTurboDelivery({changedPaths}).class,'STANDARD');
});
test('critical label overrides bounded scope',()=>{
  assert.equal(classifyTurboDelivery({changedPaths:['portal-v2/card.js'],labels:['delivery:critical']}).class,'CRITICAL');
});
