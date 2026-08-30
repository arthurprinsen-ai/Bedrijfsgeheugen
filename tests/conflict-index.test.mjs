import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyConflict } from '../platform/delivery/conflict-index.mjs';

const change=(overrides={})=>({changeId:'a',platform:'github',changedResources:['portal/app.mjs'],contractKeys:['portal-state:v4'],hardBoundary:false,...overrides});

test('unrelated changes do not create artificial waiting',()=>{
  const result=classifyConflict(change(),[change({changeId:'seo',platform:'dataforseo',changedResources:['query:keywords'],contractKeys:['seo-evidence:v1']})]);
  assert.equal(result.state,'NO_RELEVANT_DRIFT');
  assert.deepEqual(result.resourceOverlap,[]);
  assert.deepEqual(result.contractOverlap,[]);
});

test('cross-platform shared contracts trigger bounded reconciliation',()=>{
  const result=classifyConflict(change(),[change({changeId:'supa',platform:'supabase',changedResources:['table:portal_state'],contractKeys:['portal-state:v4']})]);
  assert.equal(result.state,'CONTRACT_OVERLAP');
  assert.deepEqual(result.contractOverlap,['portal-state:v4']);
});

test('path overlap is classified separately from contract overlap',()=>{
  const result=classifyConflict(change({contractKeys:[]}),[change({changeId:'b',changedResources:['portal/app.mjs'],contractKeys:[]})]);
  assert.equal(result.state,'PATH_OVERLAP_SAFE');
  assert.deepEqual(result.resourceOverlap,['portal/app.mjs']);
});

test('explicit merge conflict wins over unrelated drift and behindBy never conflicts alone',()=>{
  assert.equal(classifyConflict(change({mergeConflict:true,behindBy:99}),[]).state,'MERGE_CONFLICT');
  assert.equal(classifyConflict(change({behindBy:99}),[]).state,'NO_RELEVANT_DRIFT');
});

test('hard boundary blocks only the affected candidate',()=>{
  assert.equal(classifyConflict(change({hardBoundary:true}),[]).state,'HARD_BOUNDARY');
});
