import test from 'node:test';
import assert from 'node:assert/strict';
import {CRO_EXPERIMENT_CONTRACT,designCroExperiment,evaluateCroExperiment,projectCroLearning} from './cro-experiment-cycle.mjs';

const guards=Object.fromEntries([
 'consent_respected','dismissible','keyboard_accessible','no_blocking_mobile_overlay',
 'no_deceptive_copy','no_sensitive_profiling','one_prompt_per_session',
 'no_duplicate_exposure','rollback_available'
].map(k=>[k,true]));
const input={
 id:'cro:scan:20261029',tenantId:'bedrijfsgeheugen',pageCanonical:'/frisse-blik',
 surface:'scan_followup',hypothesis:'Voluntary contextual help improves qualified lead completion',
 falsifier:'No improvement in qualified leads after sufficient matured exposure',
 primaryMetric:'qualified_leads',sourceEvidenceId:'ga4:source:verified-001',sourceVerified:true,
 baselineRate:0.04,expectedMinimumLift:0.01,ownerAgent:'cro',
 exposureUnit:'consented-anonymous-visitor-id',minimumPerArm:100,horizonHours:336,
 variantIds:['control-v1','contextual-help-v1'],allocationTreatment:0.5,
 assignmentPersistedBeforeExposure:true,existingHeartbeatOwner:'powerhouse-commercial-learning-v1',
 guardrails:guards,rollbackRef:'git:protected-release-revert',preRegisteredAt:'2026-10-29T12:00:00Z'
};
const readback={controlExposures:1000,treatmentExposures:1000,controlConversions:40,treatmentConversions:80,
 assignmentEvidenceId:'assignment:verified:001',exposureEvidenceId:'exposure:verified:001',
 primaryOutcomeEvidenceId:'outcome:verified:001',assignmentReadbackVerified:true,
 exposureReadbackVerified:true,primaryOutcomeReadbackVerified:true,horizonMatured:true};

test('preserves canonical owner and all preregistration fields',()=>{
 const d=designCroExperiment(input);
 assert.equal(d.contract,CRO_EXPERIMENT_CONTRACT);
 assert.equal(d.state,'PREREGISTERED');
 assert.deepEqual(d.errors,[]);
 assert.equal(d.noNewScheduler,true);
 assert.equal(d.permission.includes('NO_PUBLICATION'),true);
});
test('missing primary data, consent and unstable assignment block design',()=>{
 const d=designCroExperiment({...input,sourceVerified:false,baselineRate:null,assignmentPersistedBeforeExposure:false,guardrails:{...guards,consent_respected:false}});
 assert.equal(d.state,'DESIGN_BLOCKED');
 assert.ok(d.errors.includes('VERIFIED_BASELINE_SOURCE_REQUIRED'));
 assert.ok(d.errors.includes('PERSISTED_PRE_TREATMENT_ASSIGNMENT_REQUIRED'));
 assert.ok(d.errors.includes('GUARDRAIL_consent_respected'));
});
test('mobile exit intent is forbidden',()=>{
 const d=designCroExperiment({...input,surface:'exit_intent',triggerDevice:'mobile'});
 assert.ok(d.errors.includes('EXIT_INTENT_DESKTOP_ONLY'));
});
test('verified effect is only a candidate, never an auto deployment or paid revenue',()=>{
 const d=designCroExperiment(input);
 const e=evaluateCroExperiment(d,readback);
 assert.equal(e.status,'CANDIDATE_WIN');
 assert.equal(e.releaseAllowed,false);
 assert.equal(e.verifiedPaidRevenueEur,null);
 assert.ok(e.pValue<0.05);
 const learning=projectCroLearning(d,e);
 assert.equal(learning.writebackVerified,false);
 assert.equal(learning.productionVerified,false);
 assert.equal(learning.status,'CANDIDATE_WIN');
 assert.ok(learning.evidenceRefs.includes('outcome:verified:001'));
});
test('guardrail regression or privacy failure stops before significance',()=>{
 const d=designCroExperiment(input);
 assert.equal(evaluateCroExperiment(d,{...readback,guardrailRegression:true}).status,'STOP');
 assert.equal(evaluateCroExperiment(d,{...readback,consentViolation:true}).status,'STOP');
});
test('sample ratio mismatch invalidates strong lift',()=>{
 const d=designCroExperiment(input);
 const e=evaluateCroExperiment(d,{...readback,controlExposures:200,treatmentExposures:1800});
 assert.equal(e.status,'INVALID');assert.equal(e.reason,'SAMPLE_RATIO_MISMATCH');
});
test('no assignment readback and no outcome readback never count as proof',()=>{
 const d=designCroExperiment(input);
 assert.equal(evaluateCroExperiment(d,{...readback,assignmentReadbackVerified:false}).status,'MEASUREMENT_REQUIRED');
 assert.equal(evaluateCroExperiment(d,{...readback,primaryOutcomeReadbackVerified:false}).status,'MEASUREMENT_REQUIRED');
});
test('sample, horizon and zero-variance guards are explicit',()=>{
 const d=designCroExperiment(input);
 assert.equal(evaluateCroExperiment(d,{...readback,controlExposures:60,treatmentExposures:60}).status,'INCONCLUSIVE');
 assert.equal(evaluateCroExperiment(d,{...readback,horizonMatured:false}).status,'INCONCLUSIVE');
 assert.equal(evaluateCroExperiment(d,{...readback,controlConversions:0,treatmentConversions:0}).status,'INCONCLUSIVE');
});
test('normal approximation insufficient with rare outcomes',()=>{
 const d=designCroExperiment(input);
 const e=evaluateCroExperiment(d,{...readback,controlConversions:1,treatmentConversions:3});
 assert.equal(e.reason,'NORMAL_APPROXIMATION_INVALID_USE_EXACT_METHOD');
});
test('unconfirmed paid orders block revenue-aligned winner',()=>{
 const d=designCroExperiment({...input,primaryMetric:'verified_paid_orders'});
 const e=evaluateCroExperiment(d,readback);
 assert.equal(e.status,'MEASUREMENT_REQUIRED');
});
test('inconclusive or negative effects cannot promote',()=>{
 const d=designCroExperiment(input);
 const e=evaluateCroExperiment(d,{...readback,treatmentConversions:40});
 assert.equal(e.status,'INCONCLUSIVE');
 const negative=evaluateCroExperiment(d,{...readback,treatmentConversions:20});
 assert.equal(negative.status,'CANDIDATE_LOSS');
 assert.equal(negative.releaseAllowed,false);
});
