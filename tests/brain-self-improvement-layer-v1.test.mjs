import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AGENT_OBJECTIVES,
  SELF_IMPROVEMENT_CONTRACT,
  evaluatePromotionCandidate,
  routeModel,
  evaluateAgentObjective,
  assessArchitecture,
  compileLearning,
  buildDailyImprovementScore
} from '../brain/self-improvement/self-improvement-layer.mjs';

test('self improvement contract is evidence-first and controlled',()=>{
  assert.equal(SELF_IMPROVEMENT_CONTRACT.version,'powerhouse-self-improvement-layer.v1');
  assert.ok(SELF_IMPROVEMENT_CONTRACT.hardRules.includes('no_uncontrolled_self_modification'));
  assert.equal(DEFAULT_AGENT_OBJECTIVES.length,6);
});

test('promotion rejects security regression and unknown evidence',()=>{
  const rejected=evaluatePromotionCandidate({
    baseline:{qualityScore:.8,businessOutcome:10,cost:1,latencyMs:100},
    candidate:{qualityScore:.9,businessOutcome:12,cost:1.05,latencyMs:105,evidenceRefs:['a','b'],gates:{quality:true,security:false,regression:true}}
  });
  assert.equal(rejected.promotable,false);
  assert.equal(rejected.decision,'REJECT');

  const sourceSha='a'.repeat(40);
  const input={
    baseline:{qualityScore:.8,businessOutcome:10,cost:1,latencyMs:100},
    candidate:{sourceSha,qualityScore:.9,businessOutcome:12,cost:1.05,latencyMs:105,
      evidenceRefs:['provider-eval-1','provider-eval-2'],
      gates:{quality:true,security:true,regression:true}},
    now:'2026-10-23T12:00:00Z'
  };
  const assertedOnly=evaluatePromotionCandidate(input);
  assert.equal(assertedOnly.promotable,false);
  assert.equal(assertedOnly.decision,'GATHER_MORE_EVIDENCE');
  assert.equal(assertedOnly.independentlyVerifiedEvidenceCount,0);
  const promote=evaluatePromotionCandidate({...input,
    verifyEvidenceRef:(ref,{candidateSha})=>({
      evidence_ref:ref,candidate_sha:candidateSha,verified:true,independent:true,
      authority:'INDEPENDENT_EVALUATION',verified_at:'2026-10-23T11:00:00Z'
    })
  });
  assert.equal(promote.promotable,true);
  assert.equal(promote.decision,'PROMOTE');
  assert.equal(promote.independentlyVerifiedEvidenceCount,2);
  assert.equal(promote.releaseAuthorized,false);
  assert.equal(promote.protectedReleaseRequired,true);
});

test('model router is provider neutral and respects privacy/capability',()=>{
  const routed=routeModel({
    task:{requiredCapabilities:['reasoning'],privacyClass:'restricted',maxCostPer1k:3,maxLatencyMs:900},
    models:[
      {modelId:'cheap',provider:'a',capabilities:['reasoning'],allowedPrivacyClasses:['standard'],quality:.95,reliability:.95,costPer1k:1,latencyMs:200},
      {modelId:'safe',provider:'b',capabilities:['reasoning'],allowedPrivacyClasses:['restricted'],quality:.9,reliability:.95,costPer1k:2,latencyMs:400}
    ]
  });
  assert.equal(routed.winner.modelId,'safe');
});

test('agent objectives only learn from verified observations',()=>{
  const result=evaluateAgentObjective({
    objective:DEFAULT_AGENT_OBJECTIVES[0],
    observations:[
      {metric:'realized_revenue_eur',value:10,verified:true,observedAt:'2026-01-01T00:00:00Z'},
      {metric:'realized_revenue_eur',value:20,verified:false,observedAt:'2026-01-02T00:00:00Z'},
      {metric:'realized_revenue_eur',value:30,verified:true,observedAt:'2026-01-03T00:00:00Z'}
    ]
  });
  assert.equal(result.verifiedObservations,2);
  assert.equal(result.improving,true);
});

test('architecture guardian blocks critical drift',()=>{
  const state=assessArchitecture({
    modules:['a','b'],
    dependencies:[{from:'a',to:'b',cyclic:true}],
    securityFindings:[{severity:'critical'}],
    schemaDrift:[{id:'x'}]
  });
  assert.equal(state.promotionAllowed,false);
  assert.ok(state.blockers.includes('critical_security_findings'));
});

test('learning compiler never directly mutates production',()=>{
  const compiled=compileLearning({
    source:{id:'x',verified:true,material:true,regressionProven:true,topologyChanged:true},
    evaluation:{promotable:true}
  });
  assert.equal(compiled.compilable,true);
  assert.equal(compiled.outputs.find(x=>x.kind==='optimization_candidate').directProductionMutation,false);
});

test('daily improvement score requires guardrails',()=>{
  const score=buildDailyImprovementScore({
    companyLearning:.9,agentLearning:.9,engineeringLearning:.9,architectureHealth:.95,
    businessOutcome:.9,reliability:.95,evidenceCompleteness:.95
  });
  assert.equal(score.guardrailGreen,true);
  assert.ok(score.score>.85);
});

test('autonomous promotion cannot promote on forged, duplicate, stale or self-asserted receipts',()=>{
  const sourceSha='b'.repeat(40),now='2026-10-23T12:00:00Z';
  const input={
    baseline:{qualityScore:.8,businessOutcome:1,cost:1,latencyMs:100},
    candidate:{sourceSha,qualityScore:.9,businessOutcome:2,cost:1,latencyMs:100,
      evidenceRefs:['provider-1','provider-2'],gates:{quality:true,security:true,regression:true}},
    now
  };
  const proof=(ref,{candidateSha})=>({
    evidence_ref:ref,candidate_sha:candidateSha,verified:true,independent:true,
    authority:'PROVIDER_READBACK',verified_at:'2026-10-23T11:00:00Z'
  });
  for(const verifyEvidenceRef of [
    undefined,
    ()=>true,
    ref=>({...proof(ref,{candidateSha:sourceSha}),independent:false}),
    ref=>({...proof(ref,{candidateSha:sourceSha}),candidate_sha:'c'.repeat(40)}),
    ref=>({...proof(ref,{candidateSha:sourceSha}),authority:'SELF_ATTESTED'}),
    ref=>({...proof(ref,{candidateSha:sourceSha}),verified_at:'2026-10-24T12:00:00Z'}),
    ()=>{throw Error('provider temporarily unavailable');}
  ]){
    const result=evaluatePromotionCandidate({...input,verifyEvidenceRef});
    assert.equal(result.promotable,false);
    assert.equal(result.releaseAuthorized,false);
    assert.equal(result.decision,'GATHER_MORE_EVIDENCE');
  }
  const dedup=evaluatePromotionCandidate({...input,
    candidate:{...input.candidate,evidenceRefs:['provider-1','provider-1']},
    verifyEvidenceRef:proof,minEvidence:0,requiredGates:[]});
  assert.equal(dedup.promotable,false);
  assert.equal(dedup.independentlyVerifiedEvidenceCount,1);
  assert.equal(dedup.minimumVerifiedEvidence,2);
  const security=evaluatePromotionCandidate({...input,
    candidate:{...input.candidate,gates:{quality:true,regression:true}},
    verifyEvidenceRef:proof,minEvidence:0,requiredGates:[]});
  assert.equal(security.promotable,false);
  assert.equal(security.decision,'REJECT');
  assert.equal(security.gates.security,'unknown');
  const wrongSha=evaluatePromotionCandidate({...input,
    candidate:{...input.candidate,sourceSha:undefined},verifyEvidenceRef:proof});
  assert.equal(wrongSha.promotable,false);
});
