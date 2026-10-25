import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDueRevenueBatch,createRevenueEvaluator} from '../netlify/functions/revenue-learning-evaluate.mjs';

const time=new Date('2026-10-25T08:00:00.000Z');
const row=(channel,i,quality='OBSERVED')=>({
  evidenceId:`${channel}:${i}`,contentId:`content:${channel}:${i}`,channel,
  dataQuality:quality,sourceRefs:quality==='OBSERVED'?[`provider:${i}`]:[],
  updatedAt:'2026-10-25T07:00:00.000Z',publishedAt:'2026-10-20T07:00:00.000Z',
  windowHours:24
});
const hour=(i)=>new Date(time.getTime()+i*3600000);

test('no-starvation: a static 54-item source-debt queue gets coverage in seven hourly rounds',()=>{
  const due=Array.from({length:54},(_,i)=>row('website',i,'INFERRED'));
  const visited=new Set();
  for(let t=0;t<7;t++){
    const batch=selectDueRevenueBatch(due,{now:hour(t),limit:8});
    assert.equal(batch.length,8);
    for(const item of batch)visited.add(item.evidenceId);
  }
  assert.equal(visited.size,54,'same blocked first items may not consume every hour');
});

test('two channels each rotate across 12 due evidence records without starving stale items',()=>{
  const due=[...Array.from({length:12},(_,i)=>row('blog',i)),
    ...Array.from({length:12},(_,i)=>row('linkedin_company',i))];
  const ids=new Set();
  for(let t=0;t<6;t++){
    const batch=selectDueRevenueBatch(due,{now:hour(t),limit:4});
    assert.equal(batch.length,4);
    assert.equal(batch.filter(x=>x.channel==='blog').length,2);
    assert.equal(batch.filter(x=>x.channel==='linkedin_company').length,2);
    for(const item of batch)ids.add(item.evidenceId);
  }
  assert.equal(ids.size,24);
});

test('no unbounded work or duplicate IDs and stable retry of the same scheduled hour',()=>{
  const due=[...Array.from({length:63},(_,i)=>row('website',i,'INFERRED')),
    row('blog',1),row('email',2),row('instagram_company',3),row('offer',4)];
  const a=selectDueRevenueBatch(due,{now:hour(0),limit:100000});
  const b=selectDueRevenueBatch([...due].reverse(),{now:hour(0),limit:100000});
  assert.deepEqual(a,b);
  assert.ok(a.length<=16);
  assert.equal(new Set(a.map(x=>x.evidenceId)).size,a.length);
  assert.ok(a.some(x=>x.channel==='email'));
});

test('evidence debts remain OPEN and cannot fabricate earned revenue or a PROVEN learning',async()=>{
  const debt=[],writes=[];
  const due=Array.from({length:32},(_,i)=>row('website',i,'INFERRED'));
  const store={
    listDueEvidence:async()=>due,
    listCurrentLearnings:async()=>[],
    putProjection:async()=>{},
    recordObligation:async ob=>debt.push(ob),
    upsertLearning:async learning=>writes.push(learning),
    listCohort:async()=>{throw Error('UNVERIFIED_MUST_NOT_READ_COHORT');}
  };
  const first=await createRevenueEvaluator({store,now:()=>hour(0),maxDueEvidence:8})();
  const second=await createRevenueEvaluator({store,now:()=>hour(1),maxDueEvidence:8})();
  assert.equal(first.attempted,8);
  assert.equal(second.attempted,8);
  assert.equal(first.missingVerifiedSource,8);
  assert.equal(writes.length,0);
  assert.equal(new Set(debt.map(x=>x.id)).size,16);
  assert.ok(debt.every(x=>x.status==='OPEN'&&x.type==='VERIFIED_SOURCE_REQUIRED'));
});

test('invalid due rows and zero-day queues are safe without creating spurious evidence',()=>{
  assert.deepEqual(selectDueRevenueBatch([], {now:time}),[]);
  assert.deepEqual(selectDueRevenueBatch([{},null,{channel:'x'}],{now:time}),[]);
  assert.throws(()=>selectDueRevenueBatch('invalid',{now:time}),/REVENUE_DUE_EVIDENCE_MUST_BE_ARRAY/);
  assert.throws(()=>selectDueRevenueBatch([],{now:new Date('invalid')}),/REVENUE_EVALUATION_CLOCK_INVALID/);
});
