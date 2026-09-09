import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRevenueEvidence,
  revenueMetricVector,
  selectRevenueMetric,
  evaluateRevenueLearning
} from '../netlify/functions/_revenue-learning-model.mjs';

test('missing commercial evidence stays null while explicit zero stays zero',()=>{
  const v=normalizeRevenueEvidence({exposures:100,orders:0});
  assert.equal(v.orders,0);
  assert.equal(v.revenue_eur,null);
  assert.equal(v.qualified_leads,null);
});

test('revenue metric vector prioritizes commercial conversion rates per exposure',()=>{
  const v=revenueMetricVector({exposures:1000,clicks:50,leads:10,qualified_leads:4,meetings:2,proposals:1,orders:1,revenue_eur:2500,substantive_interactions:20});
  assert.equal(v.revenue_per_exposure,2.5);
  assert.equal(v.order_rate,0.001);
  assert.equal(v.proposal_rate,0.001);
  assert.equal(v.qualified_lead_rate,0.004);
  assert.equal(v.meeting_rate,0.002);
  assert.equal(v.lead_rate,0.01);
  assert.equal(v.click_rate,0.05);
});

test('highest-priority comparable commercial metric wins even when engagement is stronger',()=>{
  const target=revenueMetricVector({exposures:1000,revenue_eur:2000,orders:1,clicks:200,substantive_interactions:100});
  const cohort=[
    revenueMetricVector({exposures:1000,revenue_eur:2500,orders:1,clicks:100,substantive_interactions:40}),
    revenueMetricVector({exposures:1000,revenue_eur:3000,orders:2,clicks:90,substantive_interactions:35})
  ];
  const selected=selectRevenueMetric(target,cohort,['revenue','orders','proposals','qualified_leads','meetings','leads','clicks','substantive_interactions']);
  assert.equal(selected.metric,'revenue');
  assert.ok(selected.effectSize<0);
});

test('positive lower-priority evidence cannot promote a learning when primary commercial evidence is negative',()=>{
  const result=evaluateRevenueLearning({sampleSize:6,publicationDates:['2026-09-01','2026-09-02'],confidence:.9,effectSize:-.1,directionConsistent:false,higherPriorityContradiction:false},{promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75}});
  assert.equal(result.promotable,false);
});
