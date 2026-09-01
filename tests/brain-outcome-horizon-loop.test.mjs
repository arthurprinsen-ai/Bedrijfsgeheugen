import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scheduleOutcomeHorizons,evaluateOutcomeHorizon} from '../brain/operating-loop/outcome-horizons.mjs';

const outcome={tenantId:'T1',id:'OUT-1',type:'Outcome',verified:true,executed:true,owner:'Decision Agent',observedAt:'2026-09-01T00:00:00.000Z',evidenceIds:['E1'],result:'baseline observed'};

test('generic outcome scheduling creates exactly deterministic 30 90 180 day obligations',()=>{
  const evaluations=scheduleOutcomeHorizons(outcome,{now:'2026-09-01T00:00:00.000Z'});
  assert.deepEqual(evaluations.map(x=>x.horizonDays),[30,90,180]);
  assert.deepEqual(evaluations.map(x=>x.id),['value-eval:T1:OUT-1:30','value-eval:T1:OUT-1:90','value-eval:T1:OUT-1:180']);
  assert.deepEqual(evaluations.map(x=>x.dueAt),['2026-10-01T00:00:00.000Z','2026-11-30T00:00:00.000Z','2027-02-28T00:00:00.000Z']);
  assert.ok(evaluations.every(x=>x.status==='PENDING'&&x.verified===false));
});

test('an outcome must be verified before horizons can be scheduled',()=>{
  assert.throws(()=>scheduleOutcomeHorizons({...outcome,verified:false}),/verified Outcome/);
});

test('an evaluation can never realise value before its due instant',()=>{
  const evaluation=scheduleOutcomeHorizons(outcome)[0];
  const result=evaluateOutcomeHorizon(evaluation,{now:'2026-09-30T23:59:59.999Z',evidence:['measurement'],result:'improved',realisedValue:10,valueUnit:'percent'});
  assert.equal(result.status,'PENDING');
  assert.equal(result.verified,false);
  assert.equal(result.value,null);
});

test('due evaluation without current evidence remains owned and bounded',()=>{
  const evaluation=scheduleOutcomeHorizons(outcome)[0];
  const result=evaluateOutcomeHorizon(evaluation,{now:'2026-10-01T00:00:00.000Z',evidence:[]});
  assert.equal(result.status,'WAITING_FOR_EVIDENCE');
  assert.equal(result.verified,false);
  assert.equal(result.owner,'Decision Agent');
  assert.match(result.nextEvaluationAt,/2026-10-02/);
  assert.equal(result.value,null);
});

test('due evaluation with evidence emits verified canonical Value payload',()=>{
  const evaluation=scheduleOutcomeHorizons(outcome)[0];
  const result=evaluateOutcomeHorizon(evaluation,{now:'2026-10-01T00:00:00.000Z',evidence:['metric:1'],result:'conversion +10%',realisedValue:10,valueUnit:'percent'});
  assert.equal(result.status,'VERIFIED');
  assert.equal(result.verified,true);
  assert.equal(result.value.type,'Value');
  assert.equal(result.value.outcomeId,'OUT-1');
  assert.deepEqual(result.value.predecessorIds,['OUT-1']);
  assert.deepEqual(result.value.evidenceIds,['metric:1']);
  assert.equal(result.value.payload.horizonDays,30);
});

test('outcome horizon contract forbids premature or synthetic proof',async()=>{
  const contract=JSON.parse(await readFile('brain/contracts/outcome-horizon-loop-v1.json','utf8'));
  assert.equal(contract.version,'OUTCOME-HORIZON-LOOP-v1');
  assert.deepEqual(contract.horizonsDays,[30,90,180]);
  assert.equal(contract.prematureRealisedValueForbidden,true);
  assert.equal(contract.missingEvidenceState,'WAITING_FOR_EVIDENCE');
});
