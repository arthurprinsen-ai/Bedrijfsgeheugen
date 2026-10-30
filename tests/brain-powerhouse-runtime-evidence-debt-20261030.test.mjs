import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyPowerhouseRuntimeEvidenceDebt,RUNTIME_EVIDENCE_FINGERPRINTS} from '../brain/observability/runtime-evidence-debt-classification.mjs';
const now='2026-10-30T07:35:00Z',localDate='2026-10-30';
const sample=[
  {event_type:'revenue_flywheel_health',subject_key:'powerhouse',updated_at:'2026-10-30T07:09:00Z',
   state:'error',context:{calibration_gap:true},evidence:{due_uncalibrated_forecasts:1867,unmanaged_outcome_gaps:0,person_key:'PRIVATE_NEVER_EXPOSE'}},
  {event_type:'full_cycle_production_proof',subject_key:localDate,updated_at:'2026-10-30T07:34:33Z',
   state:'error',evidence:{healthy:false,overdue_calibrations:2085,
    daily_execution_guard:{predictive:{predictive_run_ok:true}},private_token:'SECRET_NEVER_EXPOSE'}}
];
test('two original error states are evidence debt; different denominators stay distinct',()=>{
  const result=classifyPowerhouseRuntimeEvidenceDebt(sample,{now,localDate});
  assert.equal(result.state,'EVIDENCE_DUE');
  assert.deepEqual(result.denominators,{flywheelDue:1867,fullCycleOverdue:2085});
  assert.equal(result.currentPredictiveRunOk,true);
  assert.equal(result.allGreen,false);
  assert.equal(result.technicalSuccessProven,false);
  assert.equal(result.financialOutcomeProven,false);
  assert.equal(result.forbidPublicCalibrationOfPersonAndCompany,true);
  assert.ok(!JSON.stringify(result).includes('PRIVATE_NEVER_EXPOSE'));
  assert.ok(!JSON.stringify(result).includes('SECRET_NEVER_EXPOSE'));
});
test('no source, changed source state, stale event or contradictory health implies UNVERIFIED',()=>{
  assert.equal(classifyPowerhouseRuntimeEvidenceDebt([],{now,localDate}).state,'UNVERIFIED');
  assert.equal(classifyPowerhouseRuntimeEvidenceDebt(sample.slice(0,1),{now,localDate}).state,'UNVERIFIED');
  assert.equal(classifyPowerhouseRuntimeEvidenceDebt([{...sample[0],state:'observed'},sample[1]],{now,localDate}).state,'UNVERIFIED');
  assert.equal(classifyPowerhouseRuntimeEvidenceDebt([{...sample[0],updated_at:'2026-10-30T02:00:00Z'},sample[1]],{now,localDate}).state,'UNVERIFIED');
  assert.equal(classifyPowerhouseRuntimeEvidenceDebt([sample[0],{...sample[1],evidence:{healthy:true,overdue_calibrations:2085}}],{now,localDate}).state,'UNVERIFIED');
});
test('original incident fingerprints, agents and human docs are linked',()=>{
  const root=new URL('../',import.meta.url);
  const learning=JSON.parse(readFileSync(new URL('brain/learning/2026-10-30-two-runtime-evidence-debts-v1.json',root),'utf8'));
  const agents=readFileSync(new URL('AGENTS.md',root),'utf8');
  const skill=readFileSync(new URL('.agents/skills/powerhouse-continuity/SKILL.md',root),'utf8');
  assert.equal(learning.maturity,'OBSERVED');
  assert.equal(learning.evidence.private_company_due+learning.evidence.private_person_due,2085);
  assert.equal(learning.evidence.matched_verified_outcome_candidates,0);
  assert.deepEqual(learning.evaluation.historical_replay,['tests/brain-powerhouse-runtime-evidence-debt-20261030.test.mjs']);
  for(const fingerprint of Object.values(RUNTIME_EVIDENCE_FINGERPRINTS)){
    assert.ok(agents.includes(fingerprint));
    assert.ok(skill.includes(fingerprint));
  }
  assert.ok(agents.includes('NON_PUBLIC_SCOPE_BACKLOG'));
  assert.ok(skill.includes('INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1'));
  assert.ok(learning.prevention.includes('No customer or financial outcomes may be fabricated'));
});
