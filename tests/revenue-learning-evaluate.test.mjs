import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueEvaluator} from '../netlify/functions/revenue-learning-evaluate.mjs';

test('revenue evidence supersedes stronger click engagement and checkpoints the evaluation',async()=>{
  const learnings=[],marked=[];
  const target={evidenceId:'e1',contentId:'blog:a',channel:'blog',publishedAt:'2026-09-01T00:00:00Z',windowHours:72,componentFingerprint:'topic:ai|cta:scan',publicationDate:'2026-09-01',exposures:1000,clicks:200,revenue_eur:1000,orders:1};
  const cohort=Array.from({length:5},(_,i)=>({evidenceId:`c${i}`,contentId:`blog:c${i}`,channel:'blog',publishedAt:`2026-08-0${i+1}T00:00:00Z`,publicationDate:`2026-08-0${i+1}`,exposures:1000,clicks:80,revenue_eur:2000,orders:1}));
  const store={listDueEvidence:async()=>[target],listCohort:async()=>cohort,upsertLearning:async l=>learnings.push(l),recordObligation:async()=>{},reconcileApplications:async()=>{},markEvidenceEvaluated:async(id,at)=>marked.push({id,at})};
  await createRevenueEvaluator({store,config:{promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},metricPriority:['revenue','orders','proposals','qualified_leads','meetings','leads','clicks','substantive_interactions']},now:()=>new Date('2026-09-09T00:00:00Z')})();
  assert.equal(learnings[0].effectMetric,'revenue');
  assert.ok(learnings[0].effectSize<0);
  assert.notEqual(learnings[0].status,'PROVEN');
  assert.deepEqual(marked,[{id:'e1',at:'2026-09-09T00:00:00.000Z'}]);
});

test('missing comparable evidence creates obligation instead of fake zero and stays due',async()=>{
  const obligations=[],marked=[];
  const store={listDueEvidence:async()=>[{evidenceId:'e1',contentId:'li:1',channel:'linkedin_company',windowHours:72,componentFingerprint:'hook:tension',exposures:1000}],listCohort:async()=>[],upsertLearning:async()=>{},recordObligation:async o=>obligations.push(o),reconcileApplications:async()=>{},markEvidenceEvaluated:async id=>marked.push(id)};
  await createRevenueEvaluator({store,now:()=>new Date('2026-09-09T00:00:00Z')})();
  assert.equal(obligations[0].type,'INSUFFICIENT_COHORT');
  assert.deepEqual(marked,[]);
});

test('commercially positive evidence can promote after thresholds are met',async()=>{
  const learnings=[];
  const target={evidenceId:'e1',contentId:'li:1',channel:'linkedin_company',publishedAt:'2026-09-08T00:00:00Z',publicationDate:'2026-09-08',windowHours:72,componentFingerprint:'hook:tension',exposures:1000,revenue_eur:3000};
  const cohort=Array.from({length:5},(_,i)=>({evidenceId:`c${i}`,contentId:`li:c${i}`,channel:'linkedin_company',publicationDate:i<3?'2026-09-01':'2026-09-02',exposures:1000,revenue_eur:1000}));
  const store={listDueEvidence:async()=>[target],listCohort:async()=>cohort,upsertLearning:async l=>learnings.push(l),recordObligation:async()=>{},reconcileApplications:async()=>{},markEvidenceEvaluated:async()=>{}};
  await createRevenueEvaluator({store,config:{promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},metricPriority:['revenue','orders','proposals','qualified_leads','meetings','leads','clicks','substantive_interactions']},now:()=>new Date('2026-09-09T00:00:00Z')})();
  assert.equal(learnings[0].status,'PROVEN');
  assert.equal(learnings[0].effectMetric,'revenue');
});
