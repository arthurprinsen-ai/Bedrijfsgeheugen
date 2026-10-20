import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRevenueProjector} from '../netlify/functions/revenue-learning-project.mjs';

const fixtures=(n)=>Array.from({length:n},(_,i)=>({
  kind:'social',contentId:'provider-post-'+i,channel:'linkedin_personal',
  windowHours:24,publishedAt:'2026-10-20T10:00:00Z',
  metrics:{impressions:i+1,clicks:0},sourceRefs:['snapshot-'+i]
}));
const source=items=>({listProjectionCandidates:async()=>items});
const now=()=>new Date('2026-10-20T14:00:00Z');

test('batch projection retains every observed candidate with stable unique evidence IDs',async()=>{
  const batches=[],obligations=[];
  const store={
    upsertEvidenceBatch:async items=>{batches.push(items);return {stored:true,count:items.length}},
    recordObligation:async item=>obligations.push(item)
  };
  const result=await createRevenueProjector({source:source(fixtures(123)),store,now})();
  assert.deepEqual(result,{projected:123,total:123});
  assert.deepEqual(batches.map(x=>x.length),[50,50,23]);
  const ids=batches.flat().map(x=>x.evidenceId);
  assert.equal(new Set(ids).size,123);
  assert.ok(ids.includes('provider-post-0:24'));
  assert.ok(ids.includes('provider-post-122:24'));
  assert.equal(obligations.length,0);
});

test('failed atomic batch remains pending with all IDs and is not counted as success',async()=>{
  let called=0;
  const obligations=[];
  const store={
    upsertEvidenceBatch:async items=>{called++;if(called===2)throw new Error('POOL_UNAVAILABLE');return {stored:true,count:items.length}},
    recordObligation:async item=>obligations.push(item)
  };
  const result=await createRevenueProjector({source:source(fixtures(123)),store,now})();
  assert.deepEqual(result,{projected:73,total:123});
  assert.equal(obligations.length,1);
  assert.equal(obligations[0].type,'PROJECTION_BATCH_FAILED');
  assert.equal(obligations[0].status,'OPEN');
  assert.match(obligations[0].id,/^projection-batch:[0-9a-f]{24}$/);
  assert.equal(obligations[0].evidenceIds.length,50);
  assert.equal(new Set(obligations[0].evidenceIds).size,50);
});

test('batch acknowledgement mismatch is fail-closed, not a success receipt',async()=>{
  const obligations=[];
  const store={
    upsertEvidenceBatch:async items=>({stored:true,count:items.length-1}),
    recordObligation:async item=>obligations.push(item)
  };
  const result=await createRevenueProjector({source:source(fixtures(2)),store,now})();
  assert.deepEqual(result,{projected:0,total:2});
  assert.equal(obligations.length,1);
  assert.match(obligations[0].error,/BATCH_ACK_MISMATCH/);
});

test('legacy per-item injected stores retain original contract',async()=>{
  const recorded=[];
  const store={upsertEvidence:async row=>recorded.push(row),recordObligation:async()=>{throw new Error('unexpected')}};
  const result=await createRevenueProjector({source:source(fixtures(3)),store,now})();
  assert.deepEqual(result,{projected:3,total:3});
  assert.equal(recorded.length,3);
});

test('Edge batch is tenant-scoped, max 50, ID-unique, and rejects malformed input',()=>{
  const edge=readFileSync(new URL('../supabase/functions/revenue-learning-store/index.ts',import.meta.url),'utf8');
  const api=readFileSync(new URL('../netlify/functions/_revenue-learning-store.mjs',import.meta.url),'utf8');
  const runner=readFileSync(new URL('../netlify/functions/revenue-learning-project.mjs',import.meta.url),'utf8');
  assert.match(edge,/if\(action==='upsert_evidence_batch'\)/);
  assert.match(edge,/evidences\.length>50/);
  assert.match(edge,/seen\.has\(id\)/);
  assert.match(edge,/evidenceRow\(tenant,evidence\)/);
  assert.match(edge,/onConflict:'tenant_id,evidence_id'/);
  assert.match(edge,/sha256\(token\)/);
  assert.match(api,/upsertEvidenceBatch:async/);
  assert.match(api,/REVENUE_EVIDENCE_BATCH_ACK_MISMATCH/);
  assert.match(runner,/REVENUE_PROJECTION_INCOMPLETE/);
  assert.match(runner,/status:503/);
  assert.match(runner,/createHash\('sha256'\)/);
  assert.doesNotMatch(runner,/cron\.unschedule|Buffer|Make\.com/);
});
