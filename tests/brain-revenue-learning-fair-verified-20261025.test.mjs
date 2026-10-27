import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueEvaluator,selectDueRevenueBatch,hasVerifiedRevenueSource} from '../netlify/functions/revenue-learning-evaluate.mjs';

const at=new Date('2026-10-25T08:00:00.000Z');
const row=(channel,n,quality='OBSERVED')=>({
  evidenceId:`${channel}:${n}`,contentId:`content:${channel}:${n}`,
  channel,windowHours:24,publishedAt:'2026-10-20T08:00:00Z',
  updatedAt:'2026-10-25T07:00:00Z',dataQuality:quality,
  sourceRefs:quality==='OBSERVED'?[`provider:${channel}:${n}`]:[],
});

test('bounded hourly execution visits every channel even when website dominates',()=>{
  const due=[...Array.from({length:100},(_,i)=>row('website',i,'INFERRED')),
    row('blog',1),row('linkedin_company',1),row('linkedin_personal',1),
    row('instagram_company',1),row('email',1),row('offer',1)];
  const selected=selectDueRevenueBatch(due,{now:at,limit:8});
  assert.ok(selected.length<=8);
  for(const channel of ['website','blog','linkedin_company','linkedin_personal','instagram_company','email','offer']){
    assert.ok(selected.some(x=>x.channel===channel),`channel missing: ${channel}`);
  }
  assert.equal(new Set(selected.map(x=>x.evidenceId)).size,selected.length);
});

test('same hour deterministic; successive hours rotate low priority debt',()=>{
  const due=Array.from({length:55},(_,i)=>row('website',i,'INFERRED'));
  const a=selectDueRevenueBatch(due,{now:at,limit:6});
  const b=selectDueRevenueBatch(due,{now:at,limit:6});
  const c=selectDueRevenueBatch(due,{now:new Date(at.getTime()+3600000),limit:6});
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,c);
});

test('inferred, missing-receipt and unknown metrics cannot be promoted',()=>{
  assert.equal(hasVerifiedRevenueSource(row('website',1,'INFERRED')),false);
  assert.equal(hasVerifiedRevenueSource({...row('blog',1),sourceRefs:[]}),false);
  assert.equal(hasVerifiedRevenueSource({...row('blog',1),dataQuality:'MISSING'}),false);
  assert.equal(hasVerifiedRevenueSource(row('blog',1)),true);
});

test('hourly evaluator records evidence debt without false proven learning',async()=>{
  const ops={obligations:[],cohorts:0,writes:0};
  const due=[row('website',1,'INFERRED'),row('blog',2)];
  const store={
    reconcileActionLearningObligations:async()=>({reconciled:0,total:0}),
    listDueEvidence:async()=>due,
    listCohort:async()=>{ops.cohorts++;return [row('blog',4,'INFERRED')];},
    recordObligation:async x=>ops.obligations.push(x),
    upsertLearning:async()=>{ops.writes++;},
    listCurrentLearnings:async()=>[],
    putProjection:async()=>({})
  };
  const report=await createRevenueEvaluator({store,now:()=>at,maxDueEvidence:8})();
  assert.equal(report.total,2);
  assert.equal(report.attempted,2);
  assert.equal(report.evaluated,0);
  assert.equal(report.missingVerifiedSource,1);
  assert.equal(report.insufficientCohort,1);
  assert.equal(ops.cohorts,1);
  assert.equal(ops.writes,0);
  assert.deepEqual(ops.obligations.map(x=>x.type).sort(),['INSUFFICIENT_VERIFIED_COHORT','VERIFIED_SOURCE_REQUIRED'].sort());
});

test('failed canonical store does not claim healthy learning',async()=>{
  const store={reconcileActionLearningObligations:async()=>{throw new Error('PROVIDER_UNAVAILABLE');}};
  await assert.rejects(createRevenueEvaluator({store,now:()=>at})(),/PROVIDER_UNAVAILABLE/);
});
