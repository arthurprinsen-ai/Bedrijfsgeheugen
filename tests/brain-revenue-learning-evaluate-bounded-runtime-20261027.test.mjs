import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRevenueEvaluator} from '../netlify/functions/revenue-learning-evaluate.mjs';

const projectionDefaults={listCurrentLearnings:async()=>[],putProjection:async()=>{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const target=n=>({evidenceId:`e${n}`,contentId:`blog:${n}`,channel:'blog',publishedAt:'2026-09-01T00:00:00Z',publicationDate:'2026-09-01',windowHours:24,componentFingerprint:`fp:${n}`,exposures:100,clicks:10,dataQuality:'OBSERVED',sourceRefs:[`provider:${n}`]});

test('evaluator processes due targets with bounded concurrency instead of strictly serial round-trips',async()=>{
  let active=0,peak=0;const marked=[];
  const store={...projectionDefaults,listDueEvidence:async()=>Array.from({length:8},(_,i)=>target(i)),
    listCohort:async()=>{active++;peak=Math.max(peak,active);await sleep(15);active--;return [];},
    upsertLearning:async()=>{},recordObligation:async()=>{},reconcileApplications:async()=>{},markEvidenceEvaluated:async id=>marked.push(id)};
  const r=await createRevenueEvaluator({store,concurrency:4,now:()=>new Date('2026-09-09T00:00:00Z')})();
  assert.equal(r.attempted,8);
  assert.ok(peak>1,'expected overlapping cohort reads');
  assert.ok(peak<=4,'concurrency must stay bounded');
});

test('a hanging action-evidence reconcile is deferred and does not starve evaluation',async()=>{
  const obligations=[];
  const store={...projectionDefaults,reconcileActionLearningObligations:()=>new Promise(()=>{}),
    listDueEvidence:async()=>[target(1)],listCohort:async()=>[],upsertLearning:async()=>{},
    recordObligation:async o=>obligations.push(o),reconcileApplications:async()=>{},markEvidenceEvaluated:async()=>{}};
  const r=await createRevenueEvaluator({store,reconcileBudgetMs:30,now:()=>new Date('2026-09-09T00:00:00Z')})();
  assert.equal(r.actionEvidence.deferred,true);
  assert.equal(r.attempted,1);
  assert.equal(obligations[0].type,'INSUFFICIENT_VERIFIED_COHORT');
});

test('a failing action-evidence reconcile still fails the run closed',async()=>{
  const store={...projectionDefaults,reconcileActionLearningObligations:async()=>{throw new Error('RPC_DOWN');},
    listDueEvidence:async()=>[],listCohort:async()=>[],upsertLearning:async()=>{},recordObligation:async()=>{},reconcileApplications:async()=>{},markEvidenceEvaluated:async()=>{}};
  await assert.rejects(createRevenueEvaluator({store,now:()=>new Date('2026-09-09T00:00:00Z')})(),/RPC_DOWN/);
});

test('edge gateway reconciles executed-action obligations in small parallel groups with the same RPC',async()=>{
  const src=await readFile(new URL('../supabase/functions/revenue-learning-store/index.ts',import.meta.url),'utf8');
  assert.match(src,/powerhouse_reconcile_action_learning_obligations_v1/);
  assert.match(src,/Promise\.all\(pending\.slice\(i,i\+5\)/);
  assert.match(src,/not\('executed_at','is',null\)/);
});
