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
