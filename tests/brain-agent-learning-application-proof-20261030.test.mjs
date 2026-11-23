import test from 'node:test';
import assert from 'node:assert/strict';
import {createAgentRegistry} from '../platform/agents/agent-registry.mjs';
import {createAgentFabric} from '../platform/agents/agent-fabric.mjs';
import {createLearningMemory} from '../platform/agents/learning-memory.mjs';
import {readFileSync as fsReadFileSync} from 'node:fs';

const FINGERPRINT='linkedin|personal|canonical-oauth-requests-closed-r-member-social|20261029-v1';
const actionFingerprint='exclude-r_member_social-preserve-w_member_social';
function fixture(verifier=null) {
  const memory=createLearningMemory(), events=[];
  const learning=memory.recordVerified({
    tenantId:'canonical',fingerprint:FINGERPRINT,domains:['Social','Integration'],
    sourceAgentId:'agent-integration',actionFingerprint,verified:true,
    evidence:['protected-pr-5159','production-edge-version-489'],confidence:0.9
  });
  const registry=createAgentRegistry([{id:'agent-integration',domains:['Social','Integration'],capabilities:['verify']}]);
  const fabric=createAgentFabric({registry,learningMemory:memory,
    learningApplicationVerifier:verifier,eventSink:{append:event=>{events.push(event);return event;}}});
  const work=fabric.intake({tenantId:'canonical',problemClass:FINGERPRINT,domains:['Social'],
    capabilities:['verify'],affectedObjectIds:['linkedin_personal']});
  const params={workId:work.id,learningId:learning.id,requesterAgentId:'agent-integration',
    runId:'natural-run-20261030',sourceRevision:'source-v489',
    actionFingerprint,executionRef:'provider-oauth-scope-decision:1'};
  return {memory,events,learning,fabric,work,params};
}
function independentProof(expected) {
  return { ...expected,verified:true,independent:true,exactProduction:true,
    evidenceRef:'original-brain-independent-readback:1'};
}

test('reading a verified lesson cannot create fabricated application/reuse evidence',()=>{
  const f=fixture();
  assert.equal(f.fabric.suggestLearning({workId:f.work.id}).length,1);
  assert.equal(f.fabric.suggestLearning({workId:f.work.id}).length,1);
  assert.equal(f.memory.get(f.learning.id).reuseCount,0);
  assert.equal(f.events.filter(e=>e.type==='LEARNING_SUGGESTED').length,2);
  assert.equal(f.events.filter(e=>e.type==='LEARNING_REUSED'||e.type==='LEARNING_APPLICATION_VERIFIED').length,0);
});

test('learning application fails closed without the original independent runtime verifier',async()=>{
  const f=fixture();
  await assert.rejects(f.fabric.applyLearning(f.params),/LEARNING_APPLICATION_VERIFIER_REQUIRED/);
  assert.equal(f.memory.get(f.learning.id).reuseCount,0);
});

test('caller-supplied or inconsistent evidence never proves learning application',async()=>{
  const f=fixture(async expected=>({ ...independentProof(expected),independent:false }));
  await assert.rejects(f.fabric.applyLearning(f.params),/LEARNING_APPLICATION_INDEPENDENT_PROOF_REQUIRED/);
  assert.equal(f.memory.get(f.learning.id).reuseCount,0);
  const bad=fixture(async expected=>({...independentProof(expected),runId:'other-natural-run'}));
  await assert.rejects(bad.fabric.applyLearning(bad.params),/LEARNING_APPLICATION_INDEPENDENT_PROOF_REQUIRED/);
  assert.equal(bad.memory.get(bad.learning.id).reuseCount,0);
});

test('only same-tenant same-fingerprint and exact-action source-linked independent proof records reuse once',async()=>{
  let checks=0;
  const f=fixture(async expected=>{checks++;return independentProof(expected);});
  await assert.rejects(f.fabric.applyLearning({...f.params,actionFingerprint:'replay-closed-read-scope'}),/LEARNING_APPLICATION_ACTION_MISMATCH/);
  await assert.rejects(f.fabric.applyLearning({...f.params,runId:''}),/LEARNING_APPLICATION_MISSING_RUNID/);
  const res=await f.fabric.applyLearning(f.params);
  assert.equal(res.applied,true);
  assert.equal(res.reuseCount,1);
  assert.equal(checks,1);
  assert.equal(f.memory.get(f.learning.id).reuseCount,1);
  assert.equal(f.events.filter(e=>e.type==='LEARNING_APPLICATION_VERIFIED').length,1);
  await assert.rejects(f.fabric.applyLearning(f.params),/LEARNING_APPLICATION_ALREADY_CLAIMED/);
  assert.equal(f.memory.get(f.learning.id).reuseCount,1);
});

test('different tenant cannot apply another tenant learning',async()=>{
  const f=fixture(async expected=>independentProof(expected));
  const other=f.fabric.intake({tenantId:'tenant-other',problemClass:FINGERPRINT,domains:['Social'],
    capabilities:['verify']});
  await assert.rejects(f.fabric.applyLearning({...f.params,workId:other.id}),/TENANT_OR_FINGERPRINT_MISMATCH/);
  assert.equal(f.memory.get(f.learning.id).reuseCount,0);
});

test('gateway exposes a guarded exact-runtime learning application command',()=>{
  const {readFileSync}=requireSource();
  const source=readFileSync(new URL('../platform/api/agent-fabric-gateway.mjs',import.meta.url),'utf8');
  assert.match(source,/APPLY_LEARNING:'APPLY_LEARNING'/);
  assert.match(source,/payload\.runId !== runtime\.runId/);
  assert.match(source,/requireMethod\(fabric, 'applyLearning'\)/);
});
function requireSource(){
  // Import static Node built-ins only in the test harness, no provider network or credentials.
  return {readFileSync: fsReadFileSync};
}
