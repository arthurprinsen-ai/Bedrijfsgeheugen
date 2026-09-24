import test from 'node:test';
import assert from 'node:assert/strict';
import { commercialContext, scoreOpportunity, rankOpportunities } from '../scripts/opportunity/opportunity-scout.mjs';

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

test('trigger-led MKB opportunity preserves explicit commercial context and becomes action-ready only with evidence',()=>{
  const r=scoreOpportunity({
    commercial_acquisition:true,
    source:'company-signal',
    component:'market',
    source_quality:90,
    corroboration_count:2,
    freshness_days:2,
    novelty:70,
    business_impact:90,
    confidence:0.82,
    effort:2,
    metric:'meeting_rate',
    trigger_type:'rapid_growth',
    problem_hypothesis:'Management information and responsibilities may be fragmenting as the company scales.',
    economic_impact_hypothesis:'Decision latency and rework may increase.',
    decision_maker_role:'CEO',
    buyer_stage:'problem-aware',
    recommended_next_action:'Offer a five-point Frisse Blik diagnostic.',
    recommended_content_angle:'From 30 to 70 employees: where grip typically breaks.',
    partner_route:'accountant',
    observed_at:'2026-09-24',
    evidence_refs:['company-register:headcount-growth','public-vacancies:ops-controller']
  });
  assert.equal(r.commercial_ready,true);
  assert.equal(r.commercial_execution_class,'trigger-led-next-action');
  assert.equal(r.trigger_type,'rapid_growth');
  assert.equal(r.partner_route,'accountant');
  assert.equal(r.do_not_contact_reason,null);
});

test('commercial acquisition fails closed when trigger context or evidence is incomplete',()=>{
  const r=commercialContext({
    commercial_acquisition:true,
    confidence:0.81,
    problem_hypothesis:'Possible key-person dependency',
    decision_maker_role:'Owner',
    recommended_next_action:'Offer Frisse Blik',
    evidence_refs:[]
  });
  assert.equal(r.commercial_ready,false);
  assert.equal(r.commercial_execution_class,'observe');
  assert.match(r.do_not_contact_reason,/trigger_type/);
  assert.match(r.do_not_contact_reason,/evidence_refs/);
});

test('commercial context never fabricates absent decision maker, trigger, partner route or next action',()=>{
  const r=commercialContext({commercial_acquisition:true,confidence:0.9,evidence_refs:['source:1']});
  assert.equal(r.trigger_type,null);
  assert.equal(r.problem_hypothesis,null);
  assert.equal(r.decision_maker_role,null);
  assert.equal(r.recommended_next_action,null);
  assert.equal(r.partner_route,null);
});
