// Advisory, source-bound classifier for existing ONE BRAIN / Heartbeat agents.
// It never changes database health states or grants release/publication authority.
export const RUNTIME_EVIDENCE_FINGERPRINTS = Object.freeze({
  revenue: 'powerhouse|revenue-flywheel|forecast-calibration-evidence-due|20261029-v1',
  fullCycle: 'powerhouse|full-cycle|publication-predictive-proof-gaps|20261029-v1'
});
const finiteCount = n => Number.isSafeInteger(n) && n >= 0;
const validDate = s => typeof s === 'string' && Number.isFinite(Date.parse(s));
const unknown = reason => ({state:'UNVERIFIED',reason,allGreen:false,technicalSuccessProven:false,financialOutcomeProven:false});
function latest(events, type, source, subject, nowMs, maxAgeMs) {
  // Match the exact ORIGINAL event source. A different writer may share event_type/subject_key.
  const matches = events.filter(e => e && e.event_type===type && e.source===source && e.subject_key===subject && validDate(e.updated_at))
    .sort((a,b) => Date.parse(b.updated_at)-Date.parse(a.updated_at));
  const item=matches[0];
  if(!item || nowMs-Date.parse(item.updated_at)>maxAgeMs || Date.parse(item.updated_at)>nowMs+60000) return null;
  return item;
}
/**
 * Source facts are TWO independent denominators; never equate flywheel
 * due_uncalibrated_forecasts with forecast-calibration obligations.
 * Error flags remain error until the canonical providers genuinely close them.
 * Outputs are scalar-only (no PII/forecast contents).
 */
export function classifyPowerhouseRuntimeEvidenceDebt(events,{now=new Date().toISOString(),localDate}={}) {
  if(!Array.isArray(events)||!validDate(now)||typeof localDate!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(localDate))
    return unknown('INVALID_OR_MISSING_SOURCE');
  const nowMs=Date.parse(now),maxAgeMs=2*60*60*1000;
  const fly=latest(events,'revenue_flywheel_health','powerhouse_revenue_flywheel_v1','powerhouse',nowMs,maxAgeMs);
  const cycle=latest(events,'full_cycle_production_proof','powerhouse_full_cycle_production_proof',localDate,nowMs,maxAgeMs);
  if(!fly||!cycle)return unknown('MISSING_OR_STALE_ORIGINAL_RUNTIME_EVENT');
  if(fly.state!=='error'||cycle.state!=='error')return unknown('SOURCE_STATE_CHANGED_REVALIDATE_IN_CANONICAL_HEALTH_VIEW');
  const due=fly.evidence?.due_uncalibrated_forecasts;
  const overdue=cycle.evidence?.overdue_calibrations;
  if(fly.context?.calibration_gap!==true||cycle.evidence?.healthy!==false||
     !finiteCount(due)||!finiteCount(overdue)||due===0||overdue===0)
     return unknown('MISSING_OR_CONTRADICTORY_HEALTH_GUARDS');
  const predictiveRunOk=cycle.evidence?.daily_execution_guard?.predictive?.predictive_run_ok===true;
  return {
    state:'EVIDENCE_DUE',
    sourceStates:{revenue:'error',fullCycle:'error'},
    denominators:{flywheelDue:due,fullCycleOverdue:overdue},
    currentPredictiveRunOk:predictiveRunOk,
    rootCauses:['FORECAST_CALIBRATION_EVIDENCE_DUE','FULL_CYCLE_PROVIDER_OUTCOME_PUBLICATION_EVIDENCE_DUE'],
    recoveryOwner:'EXISTING_FORECAST_OUTCOME_AND_CHANNEL_OWNERS',
    requiresIndependentProviderAndFirstPartyEvidence:true,
    forbidPublicCalibrationOfPersonAndCompany:true,
    forbidManufacturedNegativeOutcomes:true,
    forbidDuplicatePublisherOrScheduler:true,
    allGreen:false,
    technicalSuccessProven:false,
    financialOutcomeProven:false
  };
}

/**
 * Read-only, evidence-first handoff for EXISTING private-outcome, commercial
 * economics and publishing owners. This does not enqueue a second executor,
 * calibrate any private forecast, grant consent, or assert an actual outcome.
 * Inputs must be independent original database/provider aggregates, not drafts.
 */
export function planOriginalPowerhouseEvidenceRecovery({debt,privateScopes,calibrator,positiveOutcomeCandidates,economics}={}) {
  if(debt?.state!=='EVIDENCE_DUE'||debt?.allGreen!==false)
    return unknown('ORIGINAL_RUNTIME_EVIDENCE_NOT_CONFIRMED');
  const person=privateScopes?.person,company=privateScopes?.company;
  const publicDue=calibrator?.public_scope_due,privateDue=calibrator?.out_of_public_scope_due;
  const missing=economics?.missing,receipted=economics?.withProviderReceipt,linked=economics?.withOutcome;
  if(![person,company,publicDue,privateDue,positiveOutcomeCandidates,missing,receipted,linked].every(finiteCount)||
     person+company!==privateDue||receipted>missing||linked>missing||
     calibrator?.state!=='NON_PUBLIC_SCOPE_BACKLOG'||publicDue!==0)
    return unknown('PRIVATE_SCOPE_OR_ECONOMICS_SOURCE_MISSING_OR_CONTRADICTORY');
  return {
    state:'EVIDENCE_DUE',
    denominators:{privatePersonDue:person,privateCompanyDue:company,
      publicCalibratorDue:publicDue,privateCalibratorDue:privateDue,
      positiveVerifiedOutcomeCandidates:positiveOutcomeCandidates,
      missingActionEconomics:missing,withProviderReceipt:receipted,withOutcomeLink:linked},
    routes:[
      {owner:'EXISTING_PRIVATE_FIRST_PARTY_OUTCOME_RESOLVER',
       next:'INDEPENDENT_TENANT_AUTHORIZED_FORECAST_OUTCOME_MATCH_AND_RECEIPT_READBACK',
       eligibleForAutoClose:false},
      {owner:'EXISTING_PUBLIC_MARKET_CALIBRATOR',next:'NO_PUBLIC_MARKET_DUE',eligibleForAutoClose:false},
      {owner:'EXISTING_POWERHOUSE_ECONOMICS_OWNER',
       next:missing>0?'RECONCILE_ORIGINAL_PROVIDER_COST_AND_HUMAN_TIME_EVIDENCE':'NO_MISSING_ECONOMICS_ROWS_OBSERVED',
       eligibleForAutoClose:false}
    ],
    forbidPublicCalibrationOfPersonAndCompany:true,
    forbidManufacturedCostsOrNegativeOutcomes:true,
    forbidDuplicatePublisherOrScheduler:true,
    allGreen:false,technicalSuccessProven:false,financialOutcomeProven:false
  };
}
