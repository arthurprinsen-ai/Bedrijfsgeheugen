import test from 'node:test';
import assert from 'node:assert/strict';
import {selectGoalAlignedAction, countDistinctActionSources} from '../goal-action-selector.js';

const base = {
  id: 'growth-1', tenant_id: 'tenant-A', ownerCategory: 'groei', priority: 5,
  state: 'PROPOSED', source_refs: ['receipt-A'],
  evidence_health: {status: 'healthy', stale: false, confidence: 0.8},
  ownerSafety: {level: 'goedkeuring'}
};
const action = (changes={}) => ({...base,...changes});
const pick = (items, categories=['groei'], tenant='tenant-A') => selectGoalAlignedAction(items,categories,tenant);

test('uses canonical action priority rather than the first matching row',()=>{
  const low=action({id:'low',priority:2});
  const high=action({id:'high',priority:10});
  assert.equal(pick([low,high]).id,'high');
  assert.equal(pick([high,low]).id,'high');
});

test('rejects other tenant even with higher priority and healthy evidence',()=>{
  assert.equal(pick([action({tenant_id:'tenant-B',priority:100}),action({priority:1})]).tenant_id,'tenant-A');
  assert.equal(pick([action({tenant_id:'tenant-B'})]),null);
});

test('never offers stale, low-confidence, unproven or empty source references',()=>{
  assert.equal(pick([action({evidence_health:{status:'stale',stale:true,confidence:1}})]),null);
  assert.equal(pick([action({evidence_health:{status:'low-confidence',stale:false,confidence:0.2}})]),null);
  assert.equal(pick([action({source_refs:[' ','']})]),null);
  assert.equal(pick([action({source_refs:[]})]),null);
});

test('blocks ineligible action and does not execute or approve anything',()=>{
  assert.equal(pick([action({ownerSafety:{level:'niet-uitvoerbaar'}})]),null);
  const candidate=action({ownerSafety:{level:'goedkeuring'}});
  assert.equal(pick([candidate]),candidate);
  assert.equal(candidate.state,'PROPOSED');
});

test('does not recycle historical, failed or in-flight actions as next steps',()=>{
  for(const state of ['VERIFIED','OUTCOME_RECORDED','LEARNED','FAILED','BLOCKED','QUEUED','EXECUTING','READBACK_PENDING','COMPLETED']){
    assert.equal(pick([action({state})]),null, state);
  }
});

test('requires explicit goal match, login-scoped tenant and structurally valid input',()=>{
  assert.equal(pick([action()],['finance']),null);
  assert.equal(pick([action()],['groei'],''),null);
  assert.equal(pick([],[], 'tenant-A'),null);
  assert.equal(pick(null),null);
});

test('stable tie resolution prefers owner decision then confidence and identity',()=>{
  const inzien=action({id:'read',priority:3,ownerSafety:{level:'inzage'}});
  const besluit=action({id:'approve',priority:3,ownerSafety:{level:'goedkeuring'}});
  assert.equal(pick([inzien,besluit]).id,'approve');
  const a=action({id:'a',priority:3}),b=action({id:'b',priority:3});
  assert.equal(pick([b,a]).id,'a');
});

test('proof counter counts distinct nonblank references, not duplicated aliases',()=>{
  assert.equal(countDistinctActionSources(action({source_refs:['r1','r1',' ', 'r2']})),2);
  assert.equal(countDistinctActionSources(action({source_refs:null})),0);
});

test('rejects actions blocked by the canonical policy even if categorized as read-only',()=>{
  assert.equal(pick([action({ownerSafety:{level:'inzage',eligibility:'BLOCKED'}})]),null);
  assert.equal(pick([action({ownerSafety:{level:'inzage',eligibility:'AUTO_APPROVED'}})]).id,'growth-1');
});

test('unknown tenant or action status is never mistaken for a live recommendation',()=>{
  assert.equal(pick([action({tenant_id:null})]),null);
  assert.equal(pick([action({status:'COMPLETED',state:null})]),null);
  assert.equal(pick([action({status:'DECLINED'})]),null);
});

test('selector is pure and leaves the source list and nested evidence unchanged',()=>{
  const x=action({source_refs:['abc','abc','def'],ownerSafety:{level:'goedkeuring'}});
  const input=Object.freeze([Object.freeze(x)]);
  assert.equal(pick(input),x);
  assert.deepEqual(x.source_refs,['abc','abc','def']);
});

test('shows outstanding decisions without approving or executing them',()=>{
  for (const status of ['PENDING_APPROVAL', 'DECISION_REQUIRED', 'AWAITING_DECISION']) {
    const item=action({status,state:'PROPOSED',ownerSafety:{level:'goedkeuring',eligibility:'APPROVAL_REQUIRED'}});
    assert.equal(pick([item]),item,status);
    assert.equal(item.status,status);
  }
});
