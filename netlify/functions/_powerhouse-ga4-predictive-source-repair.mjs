// Pure source-truth repair projection: existing Powerhouse GA4 and forecast-calibration owners.
// No side effects, recipient/forecast details, scheduler, payment or model invocation.
export const GA4_PREDICTIVE_REPAIR_CONTRACT='POWERHOUSE_ONE_BRAIN_GA4_PRIVATE_CALIBRATION_REPAIR_V1';
const number=x=>x===null||x===undefined||x===''?null:Number.isSafeInteger(Number(x))&&Number(x)>=0?Number(x):null;
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):null;
const safeDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)?x:null;
export function projectGa4PredictiveSourceRepair({
  ga4Batches=[],ga4Coverage=[],calibrationHealth=[],predictionControl=[],revenueFlywheel=[],
  readStates={},at=new Date().toISOString()
}={}){
  const now=stamp(at);
  const empty={contract:GA4_PREDICTIVE_REPAIR_CONTRACT,asOf:null,status:'UNVERIFIED',
    ga4:{status:'UNVERIFIED',providerResponded:null,latestReportingDay:null,latestProviderRows:null,
      latestProviderMatches:null,lastNonemptyDay:null,lastNonemptyProviderRows:null,
      originalDataSpineState:null,originalSpineLastObservedAt:null},
    prediction:{status:'UNVERIFIED',publicDue:null,privateDue:null,forecastDue:null,
      forecastResolved:null,forecastResolutionDebt:null,originalPredictionState:null},
    priorities:[],guards:{noExtraScheduler:true,noNewWriter:true,
      noInventedAnalytics:true,noPrivateForecastToPublicModel:true,
      noNegativeOutcomeFromSilence:true,noUpliftOrPaidOrderClaim:true}};
  if(now===null)return {...empty,reason:'INVALID_CLOCK'};
  const safe=(key,rows)=>readStates[key]==='LIVE'&&Array.isArray(rows);
  const batchReady=safe('ga4Batches',ga4Batches);
  const batches=batchReady?[...ga4Batches].filter(x=>x&&safeDay(x.period_start)&&
    (x.source==='google-analytics-data-api'||x.source==='windsor-googleanalytics4')&&
    stamp(x.completed_at)!==null&&stamp(x.completed_at)<=now+300000&&number(x.rows_total)!==null)
    .sort((a,b)=>stamp(b.completed_at)-stamp(a.completed_at)):[];
  const latest=batches[0]||null;
  // A valid later empty report supersedes old nonempty reports. Never label old data fresh.
  const nonempty=batches.find(b=>number(b.rows_total)>0)||null;
  const cov=safe('ga4Coverage',ga4Coverage)&&ga4Coverage.length===1?ga4Coverage[0]:null;
  const age=cov?stamp(cov.last_observed_at):null;
  const ga4Status=!latest?'PROVIDER_REPORT_READBACK_UNVERIFIED':
    number(latest.rows_total)===0?'LATEST_COMPLETE_DAY_PROVIDER_ROWS_EMPTY':
    'GA4_ROWS_OBSERVED_ATTRIBUTION_SEPARATE';
  const spineStatus=cov?.coverage_state==='fresh'&&age!==null&&now-age<=30*3600000?
    'SOURCE_OBSERVATION_FRESH':cov?'ORIGINAL_DATA_SPINE_STALE_OR_INCOMPLETE':'UNVERIFIED';
  const ga4={
    status:ga4Status,
    providerResponded:latest!==null,
    latestReportingDay:latest?safeDay(latest.period_start):null,
    latestProviderRows:latest?number(latest.rows_total):null,
    latestProviderMatches:latest?number(latest.rows_attributed):null,
    latestBatchStatus:latest?String(latest.status||'UNKNOWN').slice(0,40):null,
    latestBatchObservedAt:latest?.completed_at||null,
    lastNonemptyDay:nonempty?safeDay(nonempty.period_start):null,
    lastNonemptyProviderRows:nonempty?number(nonempty.rows_total):null,
    lastNonemptyMatches:nonempty?number(nonempty.rows_attributed):null,
    originalDataSpineState:spineStatus,
    originalSpineLastObservedAt:cov?.last_observed_at||null,
    sourceScope:'GA4 verified provider report; campaign-to-social-post attribution is independent of GA4 page/sessions',
    hasVerifiedCurrentVisitors:false,
    missingDataIsNotZeroPeople:ga4Status!=='GA4_ROWS_OBSERVED_ATTRIBUTION_SEPARATE'
  };
  const pc=safe('predictionControl',predictionControl)&&predictionControl.length===1?
    predictionControl[0]:null;
  const health=safe('calibrationHealth',calibrationHealth)?
    [...calibrationHealth].filter(x=>x?.onderdeel==='powerhouse-forecast-calibrator'&&
      stamp(x.gemeten_op)!==null&&stamp(x.gemeten_op)<=now+300000)
      .sort((a,b)=>stamp(b.gemeten_op)-stamp(a.gemeten_op))[0]||null:null;
  const recentHealth=health&&now-stamp(health.gemeten_op)<=4*3600000?health:null;
  const h=recentHealth?.gegevens?.contract==='predictive-first-mover-intelligence-v1'?
    recentHealth.gegevens:null;
  const privateDue=h&&h.state==='NON_PUBLIC_SCOPE_BACKLOG'?
    number(h.out_of_public_scope_due):null;
  const publicDue=h&&['NON_PUBLIC_SCOPE_BACKLOG','PUBLIC_SCOPE_IDLE'].includes(h.state)?
    number(h.public_scope_due):null;
  const controlCurrent=pc&&stamp(pc.observed_at)!==null&&
    now-stamp(pc.observed_at)<=90*60000&&stamp(pc.observed_at)<=now+300000;
  const forecastDue=controlCurrent?number(pc.forecasts_due):null;
  const resolved=controlCurrent?number(pc.resolved_total):null;
  const debt=controlCurrent?number(pc.resolution_debt):null;
  const originalRevenue=safe('revenueFlywheel',revenueFlywheel)&&revenueFlywheel.length===1?
    number(revenueFlywheel[0].due_uncalibrated_forecasts):null;
  const predictedState=controlCurrent?String(pc.prediction_state||'UNKNOWN').slice(0,50):null;
  const state=publicDue===0&&privateDue>0?'PUBLIC_ENGINE_IDLE_PRIVATE_FIRST_PARTY_PROOF_REQUIRED':
    publicDue>0?'PUBLIC_CALIBRATION_ORIGINAL_EXECUTOR_DUE':
    controlCurrent?'CALIBRATION_SCOPE_EVIDENCE_DUE':'UNVERIFIED';
  const prediction={
    status:state,publicDue,privateDue,forecastDue,forecastResolved:resolved,
    forecastResolutionDebt:debt,originalPredictionState:predictedState,
    revenueFlywheelDueUncalibrated:originalRevenue,
    lastOriginalCalibratorAt:recentHealth?.gemeten_op||null,
    originalCalibratorTechnicalStatus:recentHealth?String(recentHealth.status||'UNVERIFIED').slice(0,50):'UNVERIFIED',
    denominatorsDistinct:true,publicCalibratorMayProcessPrivateForecasts:false,
    privateBuyerOrCompanyOutcomeVerified:false,negativeEvidenceFromNoReplyForbidden:true
  };
  const priorities=[];
  if(ga4Status!=='GA4_ROWS_OBSERVED_ATTRIBUTION_SEPARATE'||spineStatus!=='SOURCE_OBSERVATION_FRESH')
    priorities.push({
      priority:1,code:'GA4_REAL_SOURCE_REPORTING_AND_CONSENT',
      owner:'Original bg-analytics-sync-composio / GA4 Data Spine / SEO CRO',
      status:'SOURCE_EVIDENCE_DUE_NOT_EXECUTED',
      action:'Check original GA4 property and consent-gated gtag stream against real provider dated report. Check delayed 24–48h provider rows and missing campaign match separately, then use existing canonical importer only on genuine measured rows; do not mark an empty/old day as new visits.',
      success:'Recent dated nonempty original GA4 provider rows AND genuinely fresh same-property source observation; attributed campaign matches checked separately.'
    });
  if(privateDue>0)
    priorities.push({
      priority:priorities.length+1,code:'PRIVATE_FIRST_PARTY_CALIBRATION_EVIDENCE',
      owner:'Original Powerhouse Predictive/Revenue agent + ONE BRAIN outcome provider',
      status:'FIRST_PARTY_PROOF_DUE_NOT_EXECUTED',
      action:'Do not send person/company forecasts to public market AI. Under original tenant-only authorization match forecast ID, exact independent provider event, event time and predicted-event semantics before guarded calibration and original obligation closure. No negative outcome merely because no response.',
      success:'Actual independently verified first-party outcome per private forecast with original ID, protected calibration record, next-natural applied learning; verified reduction in due backlog.'
    });
  if(publicDue>0)
    priorities.push({priority:priorities.length+1,code:'PUBLIC_MARKET_CALIBRATION_ORIGINAL',
      owner:'Original powerhouse-forecast-calibrator',status:'SCHEDULED_EXECUTOR_EVIDENCE_DUE',
      action:'Use original approved public-only forecaster with actual source references and exact historical date, never private buyer data or an inferred negative outcome.',
      success:'Actual source-supported public calibration and independently verified result.'});
  return {contract:GA4_PREDICTIVE_REPAIR_CONTRACT,asOf:new Date(now).toISOString(),
    status:ga4Status==='GA4_ROWS_OBSERVED_ATTRIBUTION_SEPARATE'&&
      spineStatus==='SOURCE_OBSERVATION_FRESH'&&state==='PUBLIC_CALIBRATION_ORIGINAL_EXECUTOR_DUE'?
      'PARTIAL_REAL_SOURCE_EVIDENCE':'EVIDENCE_DUE',
    ga4,prediction,priorities,guards:empty.guards,
    nextNaturalRunProof:'Original GA4 real dated source → original private/public calibration evidence → independently verified buyer/paid outcome → learn in original ONE BRAIN/Heartbeat; source or code coverage alone is not growing business.'};
}
