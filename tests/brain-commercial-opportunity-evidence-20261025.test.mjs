import test from 'node:test';
import assert from 'node:assert/strict';
import {qualifyCommercialOpportunity,prioritizeCommercialOpportunities} from '../brain/revenue/commercial-opportunity-qualification.mjs';

const now='2026-10-25T10:00:00Z';
const fact=(other={})=>({verified:true,source_ref:'provider:receipt-101',observed_at:'2026-10-25T08:00:00Z',...other});
const need={
  desired_result:'Minder tijd kwijt aan offertes',current_approach:'Handmatige opvolging',
  problem_example:'Aanvragen bleven liggen',business_impact:'6 uur per week',
  urgency:'Dit kwartaal',success_metric:'Binnen één dag reactie',
  decision_process:'Directeur beoordeelt offerte'
};
const opportunity=(extra={})=>({opportunity_key:'opp:verified-1',company_key:'bedrijf:1',
  status:'open',stage:'opportunity',expected_value_eur:2900,evidence:{
    need_discovery:need,need_discovery_proof:fact(),offer_fit_proof:fact({offer_key:'frisse-blik-scan'}),
    decision_maker_proof:fact(),budget_proof:fact(),value_estimate_proof:fact()
  },...extra});
const outcome=(type,ext={})=>({opportunity_key:'opp:verified-1',outcome_id:'out:'+type,
  outcome_type:type,occurred_at:'2026-10-25T08:30:00Z',revenue_eur:0,
  ...ext,evidence:{verified:true,provider_receipt_id:'provider:ack-004',...ext.evidence}});

test('engagement and forecast alone are not a sellable opportunity or 2900 euro truth',()=>{
  const candidate=qualifyCommercialOpportunity({
    opportunity_key:'opp:weak',company_key:'company',
    status:'open',stage:'opportunity',expected_value_eur:2900,
    probability:.9,confidence:1,evidence:{trigger_evidence_ref:'https://news.example.org/story',
      autonomous_growth_revenue:{probability:.99}}
  },{now});
  assert.equal(candidate.classification,'RESEARCH_REQUIRED');
  assert.equal(candidate.sellable,false);
  assert.equal(candidate.expectedValueEur,null);
  assert.equal(candidate.observedRevenueEur,null);
  assert.equal(candidate.externalContactAuthorized,false);
  assert.ok(candidate.missingEvidence.includes('verified_first_party_buying_signal'));
});

test('verified need and value without a first-party buying signal only permit discovery',()=>{
  const result=qualifyCommercialOpportunity(opportunity(),{now});
  assert.equal(result.classification,'DISCOVERY_CANDIDATE');
  assert.equal(result.sellable,false);
  assert.equal(result.expectedValueEur,2900);
});

test('exact opportunity key, provider receipt, verified discovery, fit and buyer gate a proposal',()=>{
  const candidate=qualifyCommercialOpportunity(opportunity(),{
    now,salesOutcomes:[outcome('quote_requested')]
  });
  assert.equal(candidate.classification,'PROPOSAL_FOLLOW_UP');
  assert.equal(candidate.sellable,true);
  assert.equal(candidate.nextAction,'REVIEW_PROPOSAL_WITH_AUTHORIZED_CHANNEL');
  assert.equal(candidate.verifiedFunnel.proposal,1);
  assert.equal(candidate.observedRevenueEur,null);
  assert.equal(candidate.externalContactAuthorized,false);
  assert.deepEqual(candidate.evidenceRefs,['provider:ack-004']);
});

test('different opportunity and unverified source receipts cannot qualify the customer',()=>{
  const candidate=qualifyCommercialOpportunity(opportunity(),{now,salesOutcomes:[
    {...outcome('quote_requested'),opportunity_key:'opp:other'},
    {...outcome('quote_requested'),evidence:{verified:false,provider_receipt_id:'provider:ack-004'}},
    {...outcome('quote_requested'),evidence:{verified:true}}
  ]});
  assert.equal(candidate.classification,'DISCOVERY_CANDIDATE');
  assert.equal(candidate.verifiedFunnel.proposal,0);
  assert.equal(candidate.evidenceRefs.length,0);
});

test('order is not payment, and payment may be counted only once with external receipt',()=>{
  const order=outcome('order_confirmed',{revenue_eur:5000,evidence:{order_receipt_id:'order:proof-99'}});
  const withoutPayment=qualifyCommercialOpportunity(opportunity(),{now,salesOutcomes:[order]});
  assert.equal(withoutPayment.classification,'ORDER_OBSERVED');
  assert.equal(withoutPayment.nextAction,'VERIFY_PAYMENT_AND_INVOICE');
  assert.equal(withoutPayment.observedRevenueEur,null);
  const paid={...order,evidence:{...order.evidence,payment_confirmed:true,payment_receipt_id:'payment:ack-99'}};
  const withPayment=qualifyCommercialOpportunity(opportunity(),{now,salesOutcomes:[paid,paid]});
  assert.equal(withPayment.observedRevenueEur,5000);
  assert.equal(withPayment.verifiedFunnel.order,1);
  assert.equal(withPayment.nextAction,'MEASURE_REALIZED_RESULT_AND_LEARN');
});

test('old / future self-attested evidence never counts, and no-contact suppresses external action',()=>{
  const old=opportunity({evidence:{...opportunity().evidence,
    need_discovery_proof:fact({observed_at:'2025-08-01T08:00:00Z'})}});
  const result=qualifyCommercialOpportunity(old,{now,salesOutcomes:[outcome('quote_requested')]});
  assert.equal(result.confirmedProblem,false);
  assert.equal(result.sellable,false);
  const blocked=qualifyCommercialOpportunity(opportunity({evidence:{...opportunity().evidence,contact_suppressed:true}}),{
    now,salesOutcomes:[outcome('quote_requested')]});
  assert.equal(blocked.classification,'NO_CONTACT');
  assert.equal(blocked.qualificationScore,0);
  assert.equal(blocked.nextAction,'SUPPRESS_EXTERNAL_CONTACT');
});

test('portfolio prioritizes proof above guesses with deterministic gaps and no second scheduler',()=>{
  const list=prioritizeCommercialOpportunities([
    {opportunity_key:'weak',status:'open',evidence:{}},
    opportunity(),
    {opportunity_key:'closed',status:'won'},
    opportunity({opportunity_key:'opp:blocked',evidence:{...opportunity().evidence,opted_out:true}})
  ],{now,salesOutcomes:[outcome('quote_requested')]});
  assert.equal(list.analyzed,3);
  assert.equal(list.classificationCounts.PROPOSAL_FOLLOW_UP,1);
  assert.equal(list.classificationCounts.RESEARCH_REQUIRED,1);
  assert.equal(list.classificationCounts.NO_CONTACT,1);
  assert.equal(list.prioritized[0].opportunityKey,'opp:verified-1');
  assert.equal(list.readOnly,true);
  assert.ok(list.missingEvidenceCounts.verified_payment_and_revenue>=2);
});
