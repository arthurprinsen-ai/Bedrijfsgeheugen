import test from 'node:test';
import assert from 'node:assert/strict';
import { commercialContext, scoreOpportunity } from '../scripts/opportunity/opportunity-scout.mjs';

test('brain replay: trigger-led acquisition becomes actionable only with explicit evidence and context',()=>{
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
    problem_hypothesis:'Management information may be fragmenting.',
    decision_maker_role:'CEO',
    recommended_next_action:'Offer Frisse Blik',
    evidence_refs:['source:a']
  });
  assert.equal(r.commercial_ready,true);
  assert.equal(r.commercial_execution_class,'trigger-led-next-action');
});

test('brain replay: incomplete commercial context fails closed without fabrication',()=>{
  const r=commercialContext({commercial_acquisition:true,confidence:0.9,evidence_refs:['source:a']});
  assert.equal(r.commercial_ready,false);
  assert.equal(r.commercial_execution_class,'observe');
  assert.equal(r.trigger_type,null);
  assert.equal(r.problem_hypothesis,null);
  assert.equal(r.decision_maker_role,null);
  assert.equal(r.recommended_next_action,null);
  assert.match(r.do_not_contact_reason,/trigger_type/);
});
