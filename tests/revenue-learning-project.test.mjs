import test from 'node:test';
import assert from 'node:assert/strict';
import {projectRevenueCandidate,createRevenueProjector} from '../netlify/functions/revenue-learning-project.mjs';

test('projection prefers exact attribution root and marks it observed',()=>{
  const out=projectRevenueCandidate({kind:'growth',contentId:'blog:/x',channel:'blog',canonical:'/x',attributionRootKey:'root:123',publishedAt:'2026-09-01T00:00:00Z',windowHours:72,metrics:{pageViews:100,ctaClicks:10,leads:3,qualifiedLeads:2,appointments:1,proposals:1,wonOrders:1,revenueEur:2900}});
  assert.equal(out.attributionKey,'root:123');
  assert.equal(out.dataQuality,'OBSERVED');
  assert.equal(out.exposures,100);
  assert.equal(out.orders,1);
  assert.equal(out.revenue_eur,2900);
});

test('canonical fallback is explicit inferred evidence',()=>{
  const out=projectRevenueCandidate({kind:'growth',contentId:'blog:/x',channel:'blog',canonical:'/x',publishedAt:'2026-09-01T00:00:00Z',windowHours:72,metrics:{pageViews:50}});
  assert.equal(out.attributionKey,'canonical:/x');
  assert.equal(out.dataQuality,'INFERRED');
});

test('social projection preserves commercial metrics alongside engagement',()=>{
  const out=projectRevenueCandidate({kind:'social',contentId:'li:1',channel:'linkedin_company',canonical:null,attributionRootKey:'campaign:abc',publishedAt:'2026-09-01T00:00:00Z',windowHours:48,metrics:{impressions:1000,comments:8,shares:4,saves:3,clicks:40,leads:5,qualified_leads:2,meetings:1,offers:1,orders:1,revenue:3500}});
  assert.equal(out.exposures,1000);
  assert.equal(out.substantive_interactions,15);
  assert.equal(out.proposals,1);
  assert.equal(out.revenue_eur,3500);
});

test('projector writes every source candidate idempotently',async()=>{
  const written=[];
  const source={listProjectionCandidates:async()=>[{kind:'growth',contentId:'blog:/x',channel:'blog',canonical:'/x',publishedAt:'2026-09-01T00:00:00Z',windowHours:24,metrics:{pageViews:10}}]};
  const store={upsertEvidence:async e=>written.push(e),recordObligation:async()=>{}};
  const result=await createRevenueProjector({source,store,now:()=>new Date('2026-09-09T00:00:00Z')})();
  assert.equal(result.projected,1);
  assert.equal(written[0].evidenceId,'blog:/x:24');
});


const candN=n=>({kind:'growth',contentId:`page:/p${n}`,channel:'website',canonical:`/p${n}`,publishedAt:'2026-10-26T00:00:00Z',windowHours:24,metrics:{pageViews:10}});

test('revenue projector writes evidence in bounded batches, not one gateway call per candidate',async()=>{
  const batches=[];let singles=0;
  const store={listProjectionCandidates:async()=>Array.from({length:250},(_,i)=>candN(i)),
    upsertEvidenceBatch:async rows=>{batches.push(rows.length);},upsertEvidence:async()=>{singles++;},recordObligation:async()=>{}};
  const r=await createRevenueProjector({store})();
  assert.deepEqual(batches,[100,100,50]);assert.equal(singles,0);assert.equal(r.projected,250);assert.equal(r.unprojected,0);
});

test('revenue projector falls back per item when a batch fails and records the failing item',async()=>{
  const obligations=[];
  const store={listProjectionCandidates:async()=>[candN(1),candN(2)],
    upsertEvidenceBatch:async()=>{throw new Error('batch down');},
    upsertEvidence:async e=>{if(e.contentId==='page:/p2')throw new Error('bad row');},
    recordObligation:async o=>{obligations.push(o);}};
  const r=await createRevenueProjector({store})();
  assert.equal(r.projected,1);assert.equal(obligations.length,1);assert.equal(obligations[0].contentId,'page:/p2');
});

test('revenue projector without a batch method keeps the previous per-item behaviour',async()=>{
  let singles=0;
  const store={listProjectionCandidates:async()=>[candN(1),candN(2),candN(3)],upsertEvidence:async()=>{singles++;},recordObligation:async()=>{}};
  const r=await createRevenueProjector({store})();
  assert.equal(singles,3);assert.equal(r.projected,3);
});
