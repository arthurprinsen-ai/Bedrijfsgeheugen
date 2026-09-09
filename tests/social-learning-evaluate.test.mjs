import test from 'node:test';
import assert from 'node:assert/strict';
import { runEvaluation } from '../netlify/functions/social-learning-evaluate.mjs';

const config={windowsHours:[24,48,72],windowToleranceHours:6,promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:0.75},metricPriority:['revenue','orders','offers','qualified_leads','meetings','dms','substantive_interactions','clicks','likes']};

test('evaluator does not synthesize zero when an expected snapshot is missing',async()=>{
  const events=[];
  const store={listDuePosts:async()=>[{postId:'p1',publishedAt:'2026-09-01T10:00:00Z',dueWindow:24}],getSnapshots:async()=>[],putEvaluation:async()=>{throw new Error('should not evaluate')},recordObligation:async o=>events.push(o)};
  const result=await runEvaluation({store,now:new Date('2026-09-02T11:00:00Z'),config});
  assert.equal(result.missedObligations,1);
  assert.equal(events[0].type,'MISSED_OBLIGATION');
});

test('48 hour evaluation rejects a distant 72 hour snapshot as missing evidence',async()=>{
  const obligations=[];
  const store={listDuePosts:async()=>[{postId:'p1',publishedAt:'2026-09-01T10:00:00Z',dueWindow:48}],getSnapshots:async()=>[{snapshotId:'s72',observedAt:'2026-09-04T10:00:00Z',metrics:{impressions:100,comments:50}}],recordObligation:async o=>obligations.push(o),putEvaluation:async()=>{throw new Error('must not evaluate distant snapshot')}};
  const result=await runEvaluation({store,now:new Date('2026-09-03T11:00:00Z'),config});
  assert.equal(result.missedObligations,1);
  assert.equal(obligations[0].windowHours,48);
});

test('same post/window evaluation uses deterministic identity',async()=>{
  const ids=[];
  const store={listDuePosts:async()=>[{postId:'p1',publishedAt:'2026-09-01T10:00:00Z',dueWindow:24}],getSnapshots:async()=>[{snapshotId:'s1',postId:'p1',observedAt:'2026-09-02T10:00:00Z',metrics:{impressions:100,comments:5}}],getCohort:async()=>[],putEvaluation:async e=>ids.push(e.evaluationId),upsertLearning:async()=>{},reconcileApplications:async()=>{}};
  await runEvaluation({store,now:new Date('2026-09-02T11:00:00Z'),config});
  await runEvaluation({store,now:new Date('2026-09-02T11:05:00Z'),config});
  assert.deepEqual(ids,['evaluation:p1:24','evaluation:p1:24']);
});

test('commercial contradiction prevents engagement-led PROVEN learning',async()=>{
  const learnings=[];
  const store={
    listDuePosts:async()=>[{postId:'p1',tenantId:'t1',platform:'linkedin_company',publishedAt:'2026-09-01T10:00:00Z',dueWindow:24,hookType:'tension'}],
    getSnapshots:async()=>[{snapshotId:'target',postId:'p1',observedAt:'2026-09-02T10:00:00Z',metrics:{impressions:100,revenue:50,comments:20,shares:5,saves:5}}],
    getCohort:async()=>Array.from({length:5},(_,i)=>({postId:`c${i}`,observedAt:`2026-08-${20+i}T10:00:00Z`,metrics:{impressions:100,revenue:100,comments:5,shares:1,saves:1}})),
    putEvaluation:async()=>{},upsertLearning:async l=>learnings.push(l),reconcileApplications:async()=>{}
  };
  await runEvaluation({store,now:new Date('2026-09-02T11:00:00Z'),config});
  assert.equal(learnings[0].effectMetric,'revenue');
  assert.notEqual(learnings[0].status,'PROVEN');
});
