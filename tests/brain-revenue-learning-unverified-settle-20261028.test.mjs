import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueEvaluator} from '../netlify/functions/revenue-learning-evaluate.mjs';

// Production 2026-10-28: every hourly run attempted 8 rows and evaluated 0, because rows without a verified
// source were only recorded as obligations and stayed "due" (no evaluated_at) forever.
const projectionDefaults={listCurrentLearnings:async()=>[],putProjection:async()=>{}};
const row=(n,extra={})=>({evidenceId:`e${n}`,contentId:`c:${n}`,channel:'blog',publishedAt:'2026-09-01T00:00:00Z',publicationDate:'2026-09-01',windowHours:24,componentFingerprint:`fp:${n}`,exposures:100,clicks:10,dataQuality:'OBSERVED',sourceRefs:[`provider:${n}`],...extra});
const run=async(due,cohort=[])=>{
  const marked=[],obligations=[];
  const store={...projectionDefaults,listDueEvidence:async()=>due,listCohort:async()=>cohort,upsertLearning:async()=>{},
    recordObligation:async o=>obligations.push(o),reconcileApplications:async()=>{},markEvidenceEvaluated:async(id,at)=>marked.push({id,at})};
  const result=await createRevenueEvaluator({store,now:()=>new Date('2026-10-28T06:00:00Z')})();
  return {result,marked,obligations};
};

test('a row without a verified source is settled after its obligation is recorded',async()=>{
  const {result,marked,obligations}=await run([row(1,{sourceRefs:[]}),row(2,{dataQuality:'INFERRED'})]);
  assert.equal(result.missingVerifiedSource,2);
  assert.equal(result.settledUnverified,2);
  assert.equal(result.evaluated,0,'settling is not a verified evaluation');
  assert.deepEqual(obligations.map(o=>o.type),['VERIFIED_SOURCE_REQUIRED','VERIFIED_SOURCE_REQUIRED']);
  assert.deepEqual(marked.map(m=>m.id).sort(),['e1','e2']);
  assert.ok(marked.every(m=>m.at==='2026-10-28T06:00:00.000Z'));
});

test('an insufficient cohort is NOT settled because it depends on other rows',async()=>{
  const {result,marked,obligations}=await run([row(3)],[]);
  assert.equal(result.insufficientCohort,1);
  assert.equal(result.settledUnverified,0);
  assert.equal(obligations[0].type,'INSUFFICIENT_VERIFIED_COHORT');
  assert.deepEqual(marked,[]);
});

test('the obligation is written before the row is settled',async()=>{
  const order=[];
  const store={...projectionDefaults,listDueEvidence:async()=>[row(4,{sourceRefs:[]})],listCohort:async()=>[],upsertLearning:async()=>{},
    recordObligation:async()=>{order.push('obligation');},reconcileApplications:async()=>{},markEvidenceEvaluated:async()=>{order.push('mark');}};
  await createRevenueEvaluator({store,now:()=>new Date('2026-10-28T06:00:00Z')})();
  assert.deepEqual(order,['obligation','mark']);
});

test('a failing obligation write leaves the row due',async()=>{
  const marked=[];
  const store={...projectionDefaults,listDueEvidence:async()=>[row(5,{sourceRefs:[]})],listCohort:async()=>[],upsertLearning:async()=>{},
    recordObligation:async()=>{throw new Error('OBLIGATION_DOWN');},reconcileApplications:async()=>{},markEvidenceEvaluated:async id=>marked.push(id)};
  await assert.rejects(createRevenueEvaluator({store,now:()=>new Date('2026-10-28T06:00:00Z')})(),/OBLIGATION_DOWN/);
  assert.deepEqual(marked,[]);
});
