import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePlatformRegistry } from '../platform/delivery/platform-registry.mjs';

const required=['github','netlify','make','notion','supabase','dataforseo'];

test('all known current platforms are registered and production governed',async()=>{
  const registry=JSON.parse(await readFile('config/brain-platform-registry.json','utf8'));
  const result=validatePlatformRegistry(registry,required);
  assert.equal(result.ok,true);
  assert.deepEqual(result.platforms,required);
});

test('every active platform declares Brain, evidence, rollback, cost and security contracts',async()=>{
  const registry=JSON.parse(await readFile('config/brain-platform-registry.json','utf8'));
  for(const platform of registry.platforms){
    assert.equal(platform.status,'active');
    assert.equal(platform.brainContractVersion,'brain.v1');
    assert.ok(platform.owner);
    assert.ok(platform.adapterType);
    assert.ok(platform.productionIdentity);
    assert.ok(platform.validation);
    assert.ok(platform.activation);
    assert.ok(platform.readBackEvidence);
    assert.ok(platform.rollback);
    assert.ok(platform.costClass);
    assert.ok(platform.securityClass);
  }
});

test('validator fails closed for a missing or incomplete required platform',()=>{
  assert.throws(()=>validatePlatformRegistry({platforms:[]},required),/missing required platform/i);
  assert.throws(()=>validatePlatformRegistry({platforms:[{platform:'github',status:'active'}]},['github']),/incomplete platform/i);
});
