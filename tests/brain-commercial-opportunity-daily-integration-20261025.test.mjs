import test from 'node:test';
import assert from 'node:assert/strict';
import { createGrowthIntelligenceDaily } from '../netlify/functions/growth-intelligence-daily.mjs';

test('existing daily Brain loop analyzes canonical opportunity gaps and does not invent EUR 2900 or an outbound execution',async()=>{
  const observed={opportunities:[],scheduled:[],brain:[],decisions:[],obligations:[]};
  const store={
    listInputs:async()=>({
      signals:[],keywords:[],bilingualKeywords:[],
      engagement:[{company_name:'Acme',event_key:'activity:1234',content_key:'linkedin:post-1',
        engagement_type:'comment',occurred_at:'2026-10-25T08:00:00Z'}],
      connections:[{bedrijf:'Acme',rol:'CIO',prioriteit:85}],
      opportunities:[{opportunity_key:'latent-demand:acme',company_key:'Acme',status:'open',
        stage:'signal',expected_value_eur:2900,expected_revenue_value:2300,
        evidence:{inference:true,trigger_evidence_ref:'https://example.org/news'}}],
      applications:[],decisions:[],obligations:[],learnings:[],offers:[],
      evidence:[],salesOutcomes:[],growthOutcomes:[],growthEvents:[],
      growthPageDaily:[],seoSearch:[]
    }),
    upsertOpportunity:async x=>observed.opportunities.push(x),
    scheduleOpportunity:async (key,dueAt,cutoff)=>observed.scheduled.push({key,dueAt,cutoff}),
    recordDecision:async x=>observed.decisions.push(x),
    recordObligation:async x=>observed.obligations.push(x),
    recordBrain:async x=>observed.brain.push(x),
    recordOfferEvidence:async()=>{},reviewLearning:async()=>{},
    recordApplication:async()=>{},updateObligation:async()=>{},
    flush:async()=>({ok:true})
  };
  const result=await createGrowthIntelligenceDaily({store,now:()=>new Date('2026-10-25T10:00:00Z')})();
  assert.equal(result.commercialOpportunitiesReviewed,1);
  assert.equal(result.commercialQualified,0);
  assert.equal(result.predictions,0);
  assert.equal(observed.decisions.length,0);
  assert.equal(observed.obligations.length,1,'evidence-only next action must be durably planned');
  assert.equal(observed.obligations[0].type,'COMMERCIAL_NEXT_ACTION_REVIEW');
  assert.equal(observed.obligations[0].payload.outreach_authorized,false);
  assert.equal(observed.obligations[0].payload.execution_state,'PLANNED_NOT_EXECUTED');
  assert.equal(observed.scheduled.length,1);
  assert.equal(result.followupCoverage.executionVerified,false);
  assert.equal(observed.opportunities.length,1);
  assert.equal(observed.opportunities[0].expected_value_eur,0);
  assert.equal(observed.opportunities[0].expected_revenue_value,0);
  assert.equal(observed.opportunities[0].score_components.commercial_evidence_status,'RESEARCH_REQUIRED');
  assert.equal(observed.opportunities[0].evidence.economic_value_verified,false);
  assert.equal(observed.opportunities[0].evidence.economic_unknown_database_zero_sentinel,true);
  assert.deepEqual(observed.opportunities[0].evidence.source_refs,['activity:1234']);
  const item=observed.brain.find(x=>x.record_id.startsWith('commercial-readiness:'));
  assert.ok(item,'same daily Brain must record the missing-information decision');
  assert.equal(item.result.state,'RESEARCH_REQUIRED');
  assert.equal(item.verified,false);
  assert.equal(item.executed,false);
  assert.equal(item.payload.execution_authority,'ASSESSMENT_ONLY_NOT_EXECUTED');
  assert.equal(item.result.observed_revenue_eur,null);
  const daily=observed.brain.find(x=>x.record_id.startsWith('growth-intelligence-scorecard'));
  assert.equal(daily.result.commercial_opportunities_reviewed,1);
  assert.equal(daily.result.commercial_sellable,0);
  assert.equal(daily.result.commercial_revenue_verified_by_this_run,false);
});
