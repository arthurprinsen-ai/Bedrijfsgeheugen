import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAgentCandidateQuality } from '../scripts/brain/agent-candidate-quality-stages.mjs';
import { buildExecutionPlan } from '../scripts/brain/parallel-engineering-fabric.mjs';

const NOW=Date.parse('2026-10-23T10:10:00Z');
const BASE='a'.repeat(40),HEAD='b'.repeat(40);
const obligation='delivery|autonomous-innovation|verified-experiment-v1';
function work(){
  return {
    id:'PROPOSAL',paths:['scripts/brain/proposal.mjs'],candidateType:'new_technique',
    baseSha:BASE,candidateSha:HEAD,obligationId:obligation,
    innovation:{
      hypothesis:'A bounded new retrieval approach improves verified answers.',
      customerOrEngineeringGoal:'Reduce unanswered verified advisor questions.',
      risk:'low',
      lease:{owner:'canonical-agent-owner',obligationId:obligation,mainSha:BASE,headSha:HEAD},
      source:{kind:'official',url:'https://opentelemetry.io/docs/specs/semconv/cicd/',observedAt:'2026-10-23T09:00:00Z'},
      baseline:{metric:'verified_answers_per_request',value:0.7,observations:35,
        direction:'higher',evidenceUrl:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39926363163'},
      experiment:{
        replayTests:['tests/brain-agent-quality-stages-v1.test.mjs'],
        comparisonPlan:'Compare the current champion to the challenger on the same observations.',
        shadowPlan:'Replay read-only without writes, record exact SHA and failures.',
        canaryPlan:'Use a bounded existing canary lane with independent outcome readback.',
        rollbackPlan:'Revert exact candidate SHA and restore the current champion on regression.'
      },
      safety:{requiredCi:true,codeql:true,tenantIsolation:true,providerReadback:true,
        noAutonomousSpend:true,noPermissionEscalation:true}
    }
  };
}
const deliveryConfig={lanes:[{id:'backend',paths:['scripts/brain/']}],
  conflictContracts:[{id:'delivery-control-plane',paths:['scripts/brain/']}]};
const policy={version:2,fail_closed_unknown_material_scope:true,
  test_profiles:{backend:['backend-contract'],control_plane:['security'],full:['required']}};

test('well-specified innovation is admitted for candidate CI, not promoted or deployed',()=>{
  const proposal=work();
  const q=evaluateAgentCandidateQuality({workPackage:proposal,now:NOW});
  assert.equal(q.status,'READY_FOR_NONPRODUCTION_CANDIDATE_CI');
  assert.equal(q.canPlanLocalExperiment,true);
  assert.equal(q.providerVerified,false);
  assert.equal(q.benefitProven,false);
  assert.equal(q.mayDispatch,false);
  assert.equal(q.mayPromote,false);
  assert.equal(q.mayWriteProduction,false);
  assert.equal(q.stages.length,7);
  assert.equal(q.stages[4].state,'REQUIRED_EXTERNAL_AUTHORITY');
  const plan=buildExecutionPlan({workPackages:[proposal],deliveryConfig,policy,now:NOW});
  assert.equal(plan.packages.length,1);
  assert.equal(plan.packages[0].qualityStages.status,'READY_FOR_NONPRODUCTION_CANDIDATE_CI');
  assert.ok(plan.packages[0].testProfiles.includes('security'));
});

test('new technology label without quality packet is blocked before any worker starts',()=>{
  const w=work();delete w.innovation;
  assert.throws(()=>buildExecutionPlan({workPackages:[w],deliveryConfig,policy,now:NOW}),
    /QUALITY_STEPS_HOLD:PROPOSAL:INNOVATION_PACKET_REQUIRED/);
});

test('proposal metadata cannot bypass missing canonical ownership or exact SHA lease',()=>{
  const cases=[
    p=>{p.innovation.lease.mainSha='c'.repeat(40);},
    p=>{p.innovation.lease.obligationId='different';},
    p=>{p.innovation.lease.headSha='d'.repeat(40);},
    p=>{p.innovation.lease.owner='';}
  ];
  for(const mutate of cases){
    const p=work();mutate(p);
    const q=evaluateAgentCandidateQuality({workPackage:p,now:NOW});
    assert.equal(q.status,'QUALITY_STEPS_HOLD');
    assert.ok(q.missing.includes('CANONICAL_WRITER_LEASE_AND_EXACT_SHA_REQUIRED'));
    assert.throws(()=>buildExecutionPlan({workPackages:[p],deliveryConfig,policy,now:NOW}),/QUALITY_STEPS_HOLD/);
  }
});

test('future, stale and unsafe source references never count as source proof',()=>{
  for(const change of [
    s=>{s.observedAt='2026-11-23T10:00:00Z';},
    s=>{s.observedAt='2026-08-01T10:00:00Z';},
    s=>{s.url='http://official.example.com/page';},
    s=>{s.url='https://localhost/admin';},
    s=>{s.url='https://user:secret@opentelemetry.io/spec';}
  ]){
    const p=work();change(p.innovation.source);
    const q=evaluateAgentCandidateQuality({workPackage:p,now:NOW});
    assert.equal(q.canPlanLocalExperiment,false);
    assert.ok(q.missing.includes('RECENT_SOURCE_PROVENANCE_REQUIRED'));
  }
});

test('unmeasured benefit, absent replay or missing shadow/control plan fail closed',()=>{
  for(const change of [
    p=>{p.innovation.baseline.observations=1;},
    p=>{p.innovation.baseline.value=Infinity;},
    p=>{p.innovation.baseline.evidenceUrl='';},
    p=>{p.innovation.experiment.replayTests=['tests/arbitrary.test.mjs'];},
    p=>{p.innovation.experiment.replayTests=[];},
    p=>{p.innovation.experiment.shadowPlan='';},
    p=>{p.innovation.experiment.rollbackPlan='';},
    p=>{p.innovation.risk='high';}
  ]){
    const p=work();change(p);
    assert.equal(evaluateAgentCandidateQuality({workPackage:p,now:NOW}).status,'QUALITY_STEPS_HOLD');
  }
});

test('no self-authored boolean may silently disable CodeQL, tenant checks, provider readback or spend gate',()=>{
  for(const key of ['requiredCi','codeql','tenantIsolation','providerReadback','noAutonomousSpend','noPermissionEscalation']){
    const p=work();p.innovation.safety[key]=false;
    const q=evaluateAgentCandidateQuality({workPackage:p,now:NOW});
    assert.ok(q.missing.includes('SECURITY_TENANT_PROVIDER_AND_SPEND_GUARDRAILS_REQUIRED'));
    assert.equal(q.mayPromote,false);
  }
});

test('ordinary previous work packages retain the same protected planning route',()=>{
  const legacy={id:'OLD',paths:['scripts/brain/existing.mjs'],baseSha:'main',candidateSha:'feature'};
  const q=evaluateAgentCandidateQuality({workPackage:legacy,now:NOW});
  assert.equal(q.applies,false);
  const plan=buildExecutionPlan({workPackages:[legacy],deliveryConfig,policy,now:NOW});
  assert.equal(plan.packages[0].qualityStages.applies,false);
  assert.ok(plan.packages[0].testProfiles.includes('security'));
  assert.equal(plan.packages[0].qualityStages.mayPromote,false);
});
