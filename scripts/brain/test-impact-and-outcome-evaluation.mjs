import assert from 'node:assert/strict';
import { buildImpactChangePlan } from '../../brain/operating-loop/change-impact.mjs';
import { createOutcomeEvaluationLedger } from '../../brain/operating-loop/value-evaluation.mjs';

const relations=[
  {tenantId:'t1',kind:'relation',id:'r1',evidenceIds:['ev1'],payload:{from:'supplier:1',to:'process:1',relation:'depends_on',weight:1}},
  {tenantId:'t1',kind:'relation',id:'r2',evidenceIds:['ev2'],payload:{from:'process:1',to:'kpi:1',relation:'drives',weight:.8}},
];
const plan=buildImpactChangePlan(relations,{tenantId:'t1',subjectId:'supplier:1',change:{from:{status:'active'},to:{status:'unavailable'}},rollback:{restore:{status:'active'}},maxDepth:3});
assert.deepEqual(plan.before,{status:'active'});
assert.deepEqual(plan.after,{status:'unavailable'});
assert.deepEqual(plan.rollback.restore,{status:'active'});
assert.equal(plan.impacts.length,2);
assert.deepEqual([...plan.evidenceIds].sort(),['ev1','ev2']);
assert.equal(plan.rollbackReady,true);

const outcome={tenantId:'t1',id:'out1',verified:true,observedAt:'2026-01-01T00:00:00.000Z'};
const ledger=createOutcomeEvaluationLedger(outcome);
assert.deepEqual(ledger.items.map(x=>x.days),[30,90,180]);
assert.equal(ledger.items[0].status,'PENDING');
const claimed=ledger.claimDue({now:'2026-02-01T00:00:00.000Z',workerId:'evaluator-1'});
assert.equal(claimed.claims.length,1);
assert.equal(claimed.claims[0].status,'CLAIMED');
const completed=claimed.complete({days:30,evidenceIds:['ev30'],result:{realisedValue:42}});
assert.equal(completed.items[0].status,'COMPLETED');
assert.deepEqual(completed.items[0].evidenceIds,['ev30']);
assert.throws(()=>claimed.complete({days:30,evidenceIds:[],result:{}}),/evidence/i);
console.log('impact change plan and outcome evaluation ledger tests passed');
