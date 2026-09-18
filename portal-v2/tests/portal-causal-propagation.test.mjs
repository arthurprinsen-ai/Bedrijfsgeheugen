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
