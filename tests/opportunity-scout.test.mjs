import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreOpportunity, rankOpportunities } from '../scripts/opportunity/opportunity-scout.mjs';

test('strong SEO query gap qualifies and routes to content owner', () => {
  const r = scoreOpportunity({
    source:'search', component:'seo', query:'kennis borgen bedrijf', route:'/kennis', opportunity_key:'low-ctr',
    source_quality:90, corroboration_count:3, freshness_days:1, novelty:80, business_impact:90,
    confidence:0.85, effort:2, metric:'organic_ctr'
  });
  assert.equal(r.qualified, true);
  assert.ok(['10','15'].includes(r.owner_agent));
  assert.equal(r.execution_class, 'preview-experiment');
});

test('single weak competitor claim does not qualify', () => {
  const r = scoreOpportunity({
    source:'competitor', component:'market', opportunity_key:'new-claim', source_quality:35,
    corroboration_count:1, freshness_days:2, novelty:90, business_impact:60, confidence:0.4, effort:3, metric:'lead_rate'
  });
  assert.equal(r.qualified, false);
});

test('recurring customer objection plus search demand qualifies', () => {
  const r = scoreOpportunity({
    source:'customer-signal', component:'positioning', opportunity_key:'ownership-objection',
    source_quality:85, corroboration_count:4, freshness_days:2, novelty:70, business_impact:95,
    confidence:0.9, effort:2, metric:'conversion_rate', search_demand_confirmed:true
  });
  assert.equal(r.qualified, true);
});

test('critical security finding ranks ahead of commercial opportunity', () => {
  const ranked = rankOpportunities([
    { id:'commercial', priority:900, domain:'seo', security_critical:false },
    { id:'security', priority:10, domain:'security', security_critical:true }
  ]);
  assert.equal(ranked[0].id, 'security');
});