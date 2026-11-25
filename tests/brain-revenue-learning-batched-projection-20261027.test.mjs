import test from 'node:test';
import assert from 'node:assert/strict';
import {createRevenueProjector} from '../netlify/functions/revenue-learning-project.mjs';

const cand=n=>({kind:'growth',contentId:`page:/p${n}`,channel:'website',canonical:`/p${n}`,publishedAt:'2026-10-26T00:00:00Z',windowHours:24,metrics:{pageViews:10}});

test('revenue projector writes evidence in bounded batches, not one gateway call per candidate',async()=>{
  const batches=[];let singles=0;
  const store={listProjectionCandidates:async()=>Array.from({length:250},(_,i)=>cand(i)),
    upsertEvidenceBatch:async rows=>{batches.push(rows.length);},upsertEvidence:async()=>{singles++;},recordObligation:async()=>{}};
  const r=await createRevenueProjector({store})();
  assert.deepEqual(batches,[100,100,50]);assert.equal(singles,0);assert.equal(r.projected,250);assert.equal(r.unprojected,0);
});

test('revenue projector falls back per item when a batch fails and records the failing item',async()=>{
  const obligations=[];
  const store={listProjectionCandidates:async()=>[cand(1),cand(2)],
    upsertEvidenceBatch:async()=>{throw new Error('batch down');},
    upsertEvidence:async e=>{if(e.contentId==='page:/p2')throw new Error('bad row');},
    recordObligation:async o=>{obligations.push(o);}};
  const r=await createRevenueProjector({store})();
  assert.equal(r.projected,1);assert.equal(obligations.length,1);assert.equal(obligations[0].contentId,'page:/p2');
});

test('revenue projector without a batch method keeps the previous per-item behaviour',async()=>{
  let singles=0;
  const store={listProjectionCandidates:async()=>[cand(1),cand(2),cand(3)],upsertEvidence:async()=>{singles++;},recordObligation:async()=>{}};
  const r=await createRevenueProjector({store})();
  assert.equal(singles,3);assert.equal(r.projected,3);
});
