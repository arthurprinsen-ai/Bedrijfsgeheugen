import test from 'node:test';
import assert from 'node:assert/strict';
import {planCrossDomainEvolution} from '../brain/self-improvement/cross-domain-evolution.mjs';

const now='2026-10-08T14:00:00.000Z';
const change={id:'ai-route-22',tenantId:'tenant-a',sourceRevision:'rev-4',
  kind:'ai_model',statePath:'ai.model.provider',baselinePolicyVersion:'policy-4',
  candidatePolicyVersion:'policy-5',topologyChanged:true};
const baseline={qualityScore:.8,businessOutcome:100,cost:10,latencyMs:400};
const candidate={qualityScore:.91,businessOutcome:120,cost:10,latencyMs:400,
  evidenceRefs:['github-head','runner-readback'],gates:{quality:true,security:true,regression:true}};
const core={tenantId:'tenant-a',changeId:'ai-route-22',sourceRevision:'rev-4'};
const evidence={observedAt:now,evidenceRefs:['independent-provider-proof'],verified:true,...core};
const observations=[
  {...evidence,domain:'business',actionId:'sales-action-1',outcomeId:'sale-1',
    providerReceiptId:'provider-receipt-1',metric:'realized_revenue_eur',value:120},
  {...evidence,domain:'engineering',actionId:'deploy-action-1',outcomeId:'release-1',
    productionReadbackId:'netlify-deploy-1',metric:'quality_score',value:.91}
];
const comparison={...evidence,baselinePolicyVersion:'policy-4',
  candidatePolicyVersion:'policy-5',experimentId:'holdout-1',hasControlGroup:true};
function assess(overrides={}){
  const input={change,baseline,candidate,observations,comparison,now};
  const first=planCrossDomainEvolution(input);
  const reviews=first.impact.requiredReviews.map(control=>({...evidence,control,
    status:control==='CSRD_ESRS_APPLICABILITY'?'NOT_APPLICABLE':'APPROVED',
    rationale:'Scope independently assessed'}));
  return planCrossDomainEvolution({...input,reviews,...overrides});
}

test('a change propagates AI, privacy, supplier, security and CSRD review without assuming applicability',()=>{
  const report=assess({reviews:[]});
  assert.equal(report.decision,'REVIEW_REQUIRED');
  assert.ok(report.impact.affectedDomains.includes('compliance.eu_ai_act'));
  assert.ok(report.impact.affectedDomains.includes('compliance.gdpr'));
  assert.ok(report.impact.requiredReviews.includes('CSRD_ESRS_APPLICABILITY'));
  assert.equal(report.impact.csrdApplicability,'REQUIRES_EVIDENCE_NOT_INFERRED');
  assert.equal(report.nextAction.directProductionMutation,false);
});

test('verified cross-domain evidence and control group produce a protected candidate, never direct delivery',()=>{
  const report=assess();
  assert.equal(report.decision,'PROPOSE_PROTECTED_DELIVERY');
  assert.equal(report.learning.verifiedOutcomeCount,2);
  assert.equal(report.learning.realizedRevenueEur,120);
  assert.equal(report.evaluation.promotable,true);
  assert.ok(report.learning.compiledLearning.outputs.some(x=>x.kind==='system_map_writeback'));
  assert.equal(report.nextAction.authority,'existing_protected_delivery');
  assert.equal(report.nextAction.status,'PROPOSED_NOT_EXECUTED');
  assert.equal(Object.isFrozen(report.learning.compiledLearning.outputs),true);
});

test('same input is deterministic and has a stable idempotency fingerprint',()=>{
  assert.deepEqual(assess(),assess());
  const another=assess({change:{...change,sourceRevision:'rev-5'}});
  assert.notEqual(another.fingerprint,assess().fingerprint);
  assert.equal(another.decision,'REVIEW_REQUIRED');
});

test('foreign tenants, synthetic facts and acknowledgement-only events cannot satisfy evidence',()=>{
  const report=assess({observations:[
    {...observations[0],tenantId:'tenant-b'},
    {...observations[1],synthetic:true},
    {...observations[0],outcomeId:'fake',providerReceiptId:null},
    {...observations[1],testEvent:true}
  ]});
  assert.equal(report.decision,'GATHER_VERIFIED_OUTCOMES');
  assert.equal(report.learning.realizedRevenueEur,null);
  assert.deepEqual(report.learning.missingDomains,['business','engineering']);
});

test('stale or unproved CSRD applicability does not unblock the change',()=>{
  const first=assess();
  const reviews=first.impact.requiredReviews.map(control=>({...evidence,control,status:'APPROVED'}));
  reviews.find(x=>x.control==='CSRD_ESRS_APPLICABILITY').verified=false;
  assert.equal(assess({reviews}).decision,'REVIEW_REQUIRED');
  const stale=reviews.map(x=>({...x,observedAt:'2025-01-01T00:00:00.000Z',verified:true}));
  assert.equal(assess({reviews:stale}).decision,'REVIEW_REQUIRED');
});

test('correlation is not causal uplift; missing controls and regression proof fail closed',()=>{
  assert.equal(assess({comparison:{...comparison,hasControlGroup:false}}).decision,'COUNTERFACTUAL_REQUIRED');
  assert.equal(assess({comparison:{...comparison,tenantId:'other'}}).decision,'COUNTERFACTUAL_REQUIRED');
  assert.equal(assess({candidate:{...candidate,gates:{quality:true,security:false,regression:true}}}).decision,'REJECT');
  assert.equal(assess({candidate:{...candidate,evidenceRefs:[]}}).decision,'REJECT');
});

test('invalid identity, future receipts and duplicate outcomes never fabricate value',()=>{
  assert.throws(()=>assess({change:{...change,tenantId:''}}),/requires/);
  const report=assess({observations:[
    observations[0],{...observations[0],value:9999}, {...observations[1],observedAt:'2027-01-01T00:00:00Z'}
  ]});
  assert.equal(report.learning.verifiedOutcomeCount,1);
  assert.equal(report.learning.realizedRevenueEur,120);
  assert.equal(report.decision,'GATHER_VERIFIED_OUTCOMES');
});
