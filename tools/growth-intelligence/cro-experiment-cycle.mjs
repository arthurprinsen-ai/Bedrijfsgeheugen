/**
 * CRO experiment design + evaluation for the EXISTING Powerhouse Growth Intelligence.
 * Pure functions only: no scheduler, no database connection, no provider/portal writes.
 * The canonical Heartbeat owner must persist pre-registration and assignment BEFORE exposure.
 */
export const CRO_EXPERIMENT_CONTRACT = 'powerhouse-cro-lean-experiment-v1';
export const CRO_SURFACES = Object.freeze([
  'whatsapp_prompt','progressive_form','contextual_help','exit_intent',
  'interactive_qualifier','roi_calculator','scan_followup','cta_copy'
]);
const SURFACES = new Set(CRO_SURFACES);
const PRIMARY_METRICS = new Set(['qualified_leads','verified_paid_orders','scan_completions']);
const REQUIRED_GUARDS = ['consent_respected','dismissible','keyboard_accessible',
  'no_blocking_mobile_overlay','no_deceptive_copy','no_sensitive_profiling',
  'one_prompt_per_session','no_duplicate_exposure','rollback_available'];
const integer = n => Number.isSafeInteger(n) && n >= 0;
const positive = n => typeof n === 'number' && Number.isFinite(n) && n > 0;
const ref = v => typeof v === 'string' && v.trim().length >= 3;
const unique = list => [...new Set((list || []).filter(ref))];
const finiteRate = (numerator,denominator) => denominator > 0 ? numerator / denominator : null;

export function designCroExperiment(input = {}) {
  const errors = [];
  const surface = String(input.surface || '');
  if(!ref(input.id)) errors.push('EXPERIMENT_ID_REQUIRED');
  if(!ref(input.tenantId)) errors.push('TENANT_REQUIRED');
  if(!ref(input.pageCanonical)) errors.push('CANONICAL_PAGE_REQUIRED');
  if(!SURFACES.has(surface)) errors.push('UNSUPPORTED_SURFACE');
  if(!ref(input.hypothesis) || !ref(input.falsifier)) errors.push('TESTABLE_HYPOTHESIS_AND_FALSIFIER_REQUIRED');
  if(!PRIMARY_METRICS.has(input.primaryMetric)) errors.push('REVENUE_ALIGNED_PRIMARY_METRIC_REQUIRED');
  if(!ref(input.sourceEvidenceId) || input.sourceVerified !== true) errors.push('VERIFIED_BASELINE_SOURCE_REQUIRED');
  if(!Number.isFinite(input.baselineRate) || input.baselineRate < 0 || input.baselineRate > 1) errors.push('BASELINE_RATE_REQUIRED');
  if(!positive(input.expectedMinimumLift)) errors.push('MINIMUM_PRACTICAL_LIFT_REQUIRED');
  if(!ref(input.ownerAgent) || !ref(input.exposureUnit)) errors.push('OWNER_AND_STABLE_EXPOSURE_UNIT_REQUIRED');
  if(!integer(input.minimumPerArm) || input.minimumPerArm < 50) errors.push('PREDECLARED_SAMPLE_FLOOR_REQUIRED');
  if(!positive(input.horizonHours) || input.horizonHours < 24) errors.push('PREDECLARED_HORIZON_REQUIRED');
  if(!Array.isArray(input.variantIds) || input.variantIds.length !== 2 ||
    input.variantIds[0] === input.variantIds[1] || input.variantIds.some(v=>!ref(v))) errors.push('TWO_DISTINCT_VARIANTS_REQUIRED');
  if(input.allocationTreatment !== 0.5) errors.push('FIXED_50_50_ASSIGNMENT_REQUIRED');
  if(input.assignmentPersistedBeforeExposure !== true) errors.push('PERSISTED_PRE_TREATMENT_ASSIGNMENT_REQUIRED');
  if(input.existingHeartbeatOwner !== 'powerhouse-commercial-learning-v1') errors.push('EXISTING_HEARTBEAT_OWNER_REQUIRED');
  if(input.newScheduler === true || input.parallelLearningStore === true) errors.push('PARALLEL_RUNTIME_FORBIDDEN');
  for(const k of REQUIRED_GUARDS) if(input.guardrails?.[k] !== true) errors.push('GUARDRAIL_'+k);
  if(surface === 'exit_intent' && input.triggerDevice !== 'desktop') errors.push('EXIT_INTENT_DESKTOP_ONLY');
  if(!ref(input.rollbackRef)) errors.push('REVERSIBLE_RELEASE_REQUIRED');
  if(!ref(input.preRegisteredAt)) errors.push('PREREGISTRATION_TIME_REQUIRED');
  return {
    contract:CRO_EXPERIMENT_CONTRACT,id:input.id||null,tenantId:input.tenantId||null,
    surface,primaryMetric:input.primaryMetric||null,
    state:errors.length?'DESIGN_BLOCKED':'PREREGISTERED',
    errors,sourceEvidenceId:input.sourceEvidenceId||null,
    hypothesis:input.hypothesis||null,falsifier:input.falsifier||null,
    pageCanonical:input.pageCanonical||null,baselineRate:input.baselineRate??null,
    minimumPerArm:input.minimumPerArm??null,horizonHours:input.horizonHours??null,
    allocationTreatment:input.allocationTreatment??null,
    expectedMinimumLift:input.expectedMinimumLift??null,
    ownerAgent:input.ownerAgent||null,guardrails:input.guardrails||{},
    variantIds:input.variantIds||[],
    preRegisteredAt:input.preRegisteredAt||null,
    permission:'NO_PUBLICATION_WITHOUT_PROTECTED_DELIVERY_AND_PRODUCTION_READBACK',
    canonicalStorage:['powerhouse_experiment_assignments','powerhouse_experiment_policies',
      'powerhouse_cycle_events','brain_records','growth_outcomes'],
    noNewScheduler:true,noParallelStore:true
  };
}

// Abramowitz-Stegun erf approximation, sufficient for a conservative two-arm
// normal approximation after sample-floor/expected-count checks.
function erf(x) {
  const sign = x < 0 ? -1 : 1, a = Math.abs(x), t = 1/(1+0.3275911*a);
  const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-a*a);
  return sign*y;
}
const twoTail = z => Math.max(0,Math.min(1,1-erf(Math.abs(z)/Math.SQRT2)));

export function evaluateCroExperiment(design, data = {}) {
  const fail=(status,reason,extra={})=>({
    contract:CRO_EXPERIMENT_CONTRACT,experimentId:design?.id||null,status,reason,
    releaseAllowed:false,verifiedPaidRevenueEur:null,...extra
  });
  if(!design || design.state!=='PREREGISTERED' || design.errors?.length) return fail('BLOCKED','DESIGN_NOT_PREREGISTERED');
  if(data.guardrailRegression===true) return fail('STOP','GUARDRAIL_REGRESSION_ROLLBACK_REQUIRED');
  if(data.consentViolation===true || data.personalDataLeak===true) return fail('STOP','PRIVACY_GUARDRAIL_REGRESSION');
  if(data.exposureCrossedArms===true) return fail('INVALID','EXPOSURE_CONTAMINATION');
  if(!ref(data.assignmentEvidenceId) || !ref(data.exposureEvidenceId) ||
     data.assignmentReadbackVerified!==true || data.exposureReadbackVerified!==true)
     return fail('MEASUREMENT_REQUIRED','INDEPENDENT_ASSIGNMENT_AND_EXPOSURE_READBACK_REQUIRED');
  const {controlExposures:a,treatmentExposures:b,controlConversions:x,treatmentConversions:y}=data;
  if(![a,b,x,y].every(integer) || x>a || y>b) return fail('INVALID','BAD_DENOMINATORS_OR_CONVERSIONS');
  if(a+b===0) return fail('MEASUREMENT_REQUIRED','NO_EXPOSURE_EVIDENCE');
  const expectedA=(a+b)*(1-design.allocationTreatment), expectedB=(a+b)*design.allocationTreatment;
  if(expectedA<5 || expectedB<5) return fail('INCONCLUSIVE','NOT_ENOUGH_SRM_EXPOSURES');
  const srmChi=(a-expectedA)**2/expectedA+(b-expectedB)**2/expectedB;
  const srmP=twoTail(Math.sqrt(srmChi));
  if(srmP<0.001) return fail('INVALID','SAMPLE_RATIO_MISMATCH',{srmP});
  if(a<design.minimumPerArm || b<design.minimumPerArm) return fail('INCONCLUSIVE','SAMPLE_FLOOR_NOT_MET',{srmP,controlExposures:a,treatmentExposures:b});
  if(data.horizonMatured!==true) return fail('INCONCLUSIVE','PREDECLARED_HORIZON_NOT_MATURED',{srmP});
  if(!ref(data.primaryOutcomeEvidenceId) || data.primaryOutcomeReadbackVerified!==true)
    return fail('MEASUREMENT_REQUIRED','PRIMARY_OUTCOME_READBACK_REQUIRED',{srmP});
  if(design.primaryMetric==='verified_paid_orders' && data.independentOrderEvidenceVerified!==true)
    return fail('MEASUREMENT_REQUIRED','PAID_ORDER_PROOF_REQUIRED',{srmP});
  const pooled=(x+y)/(a+b);
  const expectedCounts=[a*pooled,b*pooled,a*(1-pooled),b*(1-pooled)];
  if(expectedCounts.some(n=>n<5)) return fail('INCONCLUSIVE','NORMAL_APPROXIMATION_INVALID_USE_EXACT_METHOD',{srmP});
  const controlRate=finiteRate(x,a),treatmentRate=finiteRate(y,b);
  const lift=treatmentRate-controlRate;
  const standardError=Math.sqrt(pooled*(1-pooled)*(1/a+1/b));
  if(!(standardError>0))return fail('INCONCLUSIVE','NO_VARIANCE',{srmP});
  const z=lift/standardError,pValue=twoTail(z);
  const ciHalfWidth=1.959963984540054*Math.sqrt(
    (controlRate*(1-controlRate)/a)+(treatmentRate*(1-treatmentRate)/b));
  const interval=[lift-ciHalfWidth,lift+ciHalfWidth];
  const candidate=(pValue<0.05 && Math.abs(lift)>=design.expectedMinimumLift);
  const status=candidate?(lift>0?'CANDIDATE_WIN':'CANDIDATE_LOSS'):'INCONCLUSIVE';
  return {contract:CRO_EXPERIMENT_CONTRACT,experimentId:design.id,status,
    reason:candidate?'REQUIRES_PROTECTED_IMPLEMENTATION_AND_REMEASUREMENT':'EFFECT_NOT_PROVEN',
    releaseAllowed:false,verifiedPaidRevenueEur:null,
    primaryMetric:design.primaryMetric,controlExposures:a,treatmentExposures:b,
    controlConversions:x,treatmentConversions:y,controlRate,treatmentRate,
    absoluteLift:lift,pValue,srmP,confidenceInterval95:interval,
    outcomeEvidenceId:data.primaryOutcomeEvidenceId,
    nextAction:candidate&&lift>0?'CANDIDATE_FOR_EXISTING_BG169_PROTECTED_RELEASE':'LEARN_AND_REPRIORITIZE'
  };
}

export function projectCroLearning(design, evaluation) {
  if(!design?.id || !evaluation || evaluation.experimentId!==design.id) throw new Error('CRO_LINEAGE_MISMATCH');
  // Caller MUST append idempotently via the existing ONE BRAIN writer;
  // this is a proposal, not proof that a durable write or portal refresh happened.
  return {
    kind:'EXPERIMENT_RESULT',fingerprint:'cro:'+design.id+':'+evaluation.status,
    tenantId:design.tenantId,owner:design.ownerAgent,
    evidenceRefs:unique([design.sourceEvidenceId,evaluation.outcomeEvidenceId]),
    primaryMetric:design.primaryMetric,hypothesis:design.hypothesis,
    baseline:design.baselineRate,variantIds:design.variantIds,
    status:evaluation.status,reason:evaluation.reason,
    beforeAfter:evaluation.controlRate===undefined?null:{
      control:evaluation.controlRate,treatment:evaluation.treatmentRate,
      absoluteLift:evaluation.absoluteLift,pValue:evaluation.pValue,
      interval95:evaluation.confidenceInterval95
    },
    rootCause:evaluation.status==='INVALID'?evaluation.reason:null,
    preventionRule:'Verify assignment, SRM, consent, primary outcome and guarded readback before promotion',
    requiredWriteback:'powerhouse_cycle_events -> brain_records -> portal tenant learning projection',
    writebackVerified:false,productionVerified:false,
    nextAction:evaluation.nextAction||'COLLECT_FRESH_MEASUREMENT_OR_REDESIGN'
  };
}
