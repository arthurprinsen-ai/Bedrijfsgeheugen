import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyActionRisk,evaluateActionEligibility,transitionAction} from '../portal-v2/operating-system/action-policy.js';
import {recordDecision} from '../portal-v2/operating-system/decision-model.js';

test('external and financial actions are class 3 and require approval',()=>{
 const action={channel:'email',external:true,tenant_id:'t1',provenance:'powerhouse',identity_verified:true,permission_verified:true,destination:'x@example.com'};
 assert.equal(classifyActionRisk(action),3);
 const result=evaluateActionEligibility(action,{approved:false});
 assert.equal(result.state,'APPROVAL_REQUIRED');assert.equal(result.eligible,false);
});

test('safe reversible internal action can auto approve only with safety gates',()=>{
 const action={internal:true,reversible:true,tenant_id:'t1',provenance:'powerhouse',identity_verified:true,permission_verified:true};
 assert.equal(classifyActionRisk(action),1);
 assert.equal(evaluateActionEligibility(action,{}).state,'AUTO_APPROVED');
});

test('forbidden lifecycle transitions fail closed',()=>{
 assert.throws(()=>transitionAction({state:'PROPOSED',risk_class:3},'QUEUED',{approved:false}),/ACTION_TRANSITION_FORBIDDEN/);
 assert.equal(transitionAction({state:'APPROVAL_REQUIRED',risk_class:3},'QUEUED',{approved:true,destination_verified:true,readback_required:true}).state,'QUEUED');
});

test('decision lineage preserves rejection and evidence snapshot',()=>{
 const d=recordDecision({action_id:'a1',decision:'reject',actor:'u1',reason:'te duur',evidence_snapshot:{confidence:.8}}, {now:'2026-09-16T20:00:00Z'});
 assert.equal(d.decision,'reject');assert.equal(d.action_id,'a1');assert.equal(d.timestamp,'2026-09-16T20:00:00Z');assert.ok(Object.isFrozen(d));
});
