import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const path='brain/contracts/external-producer-activation-v1.json';
const required=['registration','sharedContextRead','validation','promotionAuthority','productionIdentity','outcome','verification','costEvidence','securityEvidence','learningWriteback'];
const platforms=['make','notion','supabase','dataforseo','future'];

test('all external producers inherit one fail-closed activation chain',()=>{
  assert.equal(fs.existsSync(path),true,'external producer activation contract must exist');
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.equal(c.version,'EXTERNAL-PRODUCER-ACTIVATION-v1');
  assert.equal(c.canonicalBrainOnly,true);
  assert.equal(c.failClosed,true);
  for(const field of required) assert.equal(c.requiredStages.includes(field),true,`missing stage ${field}`);
  for(const platform of platforms){
    const p=c.platforms?.[platform];
    assert.ok(p,`missing platform ${platform}`);
    assert.equal(p.bypassAllowed,false,`${platform} bypass must be forbidden`);
    assert.equal(p.activationRequiresAllStages,true,`${platform} must require all stages`);
  }
});

test('promotion and completion cannot be inferred from provider success alone',()=>{
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.deepEqual(c.nonEvidence.sort(),['http2xx','providerAccepted','scenarioSuccess','writeAttempted'].sort());
  assert.equal(c.humanBoundaries.legalFinancial,true);
  assert.equal(c.humanBoundaries.secretsPermissionsSecurityWeakening,true);
  assert.equal(c.humanBoundaries.destructive,true);
  assert.equal(c.humanBoundaries.paidActions,true);
});
