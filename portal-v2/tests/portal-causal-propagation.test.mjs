import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPortalDomainState } from '../domain-state.js';

const maturity=level=>Object.fromEntries(['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam'].map(id=>[id,level]));

test('saved V2 input carries causal impacts into the canonical Brain record payload',async()=>{
  let state={portal:{profile:{employees:24,hourlyCost:50,maturity:maturity(2)},businessCase:{target:4,delay:6,investment:10000}}};
  const saved=[];
  const stateClient={
    async load(){return {state}},
    async write(next){state=structuredClone(next);return {mode:'authenticated',state}},
    async authHeaders(){return {authorization:'Bearer test'}},
    isDemo(){return false},
    currentUser(){return {id:'user-1'}}
  };
  const domain=createPortalDomainState(stateClient,{
    legacyStorage:null,
    businessInputSaver:async input=>{saved.push(input);return {stored:true,brainRecordId:'brain-1',currentStateRecordId:'state-1'}}
  });
  await domain.init();
  domain.set('portal.profile.employees',30);
  await domain.flush();
  assert.equal(saved.length,1);
  assert.equal(saved[0].metadata.causalPropagation,'portal-impact-engine-v1');
  assert.ok(saved[0].metadata.causalImpacts.length>0);
  const impact=saved[0].metadata.causalImpacts[0];
  assert.ok(impact.affectedPages.includes('businesscase'));
  assert.ok(impact.affectedPages.includes('advies'));
  assert.ok(impact.changes.some(change=>change.id==='manual-work-annual'));
  assert.ok(impact.changes.some(change=>change.id==='fte-lost'));
});

test('portal shell reacts to causal mutation and confirmed Brain sync without rerendering source fields mid-input',async()=>{
  const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
  assert.match(shell,/bg:portal-impact/);
  assert.match(shell,/bg:portal-brain-synced/);
  assert.match(shell,/current!==impact\.sourcePage/);
  assert.match(shell,/bg:portal-overview-refresh/);
});

test('cloud/AI/CSRD impact is persisted in same canonical input metadata, not only rendered in browser',async()=>{
  let state={portal:{'data-ai-passport':{residency:'eu-central-1'}}};
  const stored=[];
  const client={load:async()=>({state}),write:async next=>({mode:'authenticated',state:state=structuredClone(next)}),authHeaders:async()=>({authorization:'Bearer test'}),isDemo:()=>false,currentUser:()=>({id:'user-1'})};
  const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async input=>{stored.push(input);return {stored:true,sourceRevision:'revision-1'}}});
  await domain.init();
  domain.set('portal.data-ai-passport.residency','eu-west-1');
  await domain.flush();
  const impact=stored[0].metadata.causalImpacts[0];
  assert.equal(impact.mappingStatus,'MAPPED');
  assert.ok(impact.reviewDomains.includes('csrd-esrs'));
  assert.ok(impact.affectedPages.includes('csrd-impact'));
  assert.equal(impact.externalExecutionAuthorized,false);
  assert.equal(impact.evidenceStatus,'OBSERVED_NOT_VERIFIED');
});

test('missing canonical business input acknowledgement never silently clears pending impact',async()=>{
  let state={portal:{koppelingen:{provider:'A'}}};
  let attempts=0;
  const client={load:async()=>({state}),write:async next=>({mode:'authenticated',state:state=structuredClone(next)}),authHeaders:async()=>({authorization:'Bearer test'}),isDemo:()=>false,currentUser:()=>({id:'user-1'})};
  const domain=createPortalDomainState(client,{legacyStorage:null,businessInputSaver:async()=>{attempts++;return attempts===1?{stored:false}:{stored:true,sourceRevision:'revision-2'}}});
  await domain.init();
  domain.set('portal.koppelingen.provider','B');
  await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
  await domain.flush();
  assert.equal(attempts,2,'unacknowledged impact must be retried');
});
