import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectGa4PredictiveSourceRepair,GA4_PREDICTIVE_REPAIR_CONTRACT}
 from '../netlify/functions/_powerhouse-ga4-predictive-source-repair.mjs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const at='2026-10-30T14:10:00.000Z';
const states={ga4Batches:'LIVE',ga4Coverage:'LIVE',calibrationHealth:'LIVE',
 predictionControl:'LIVE',revenueFlywheel:'LIVE'};
const snapshot={
 at,readStates:states,ga4Batches:[
 {run_id:'a',period_start:'2026-10-29',source:'google-analytics-data-api',
   completed_at:'2026-10-30T00:05:02Z',rows_total:0,rows_attributed:0,status:'IMPORTED'},
 {run_id:'b',period_start:'2026-10-28',source:'google-analytics-data-api',
   completed_at:'2026-10-29T06:05:02Z',rows_total:1,rows_attributed:0,status:'PARTIAL'}
 ],
 ga4Coverage:[{source_key:'ga4-analytics',last_observed_at:'2026-10-29T06:05:02Z',
  coverage_state:'stale',observation_count:93}],
 calibrationHealth:[{onderdeel:'powerhouse-forecast-calibrator',gemeten_op:'2026-10-30T13:50:01Z',
   status:'ok',gegevens:{contract:'predictive-first-mover-intelligence-v1',
    public_scope_due:0,out_of_public_scope_due:2085,state:'NON_PUBLIC_SCOPE_BACKLOG'}}],
 predictionControl:[{observed_at:'2026-10-30T14:06:47Z',forecasts_due:2005,
   resolved_total:138,resolution_debt:1867,prediction_state:'RESOLUTION_DEBT_CRITICAL'}],
 revenueFlywheel:[{due_uncalibrated_forecasts:1867}]
};
test('real-source historical GA4/forecast: one nonempty past day is NOT fresh today',()=>{
 const p=projectGa4PredictiveSourceRepair(snapshot);
 assert.equal(p.contract,GA4_PREDICTIVE_REPAIR_CONTRACT);
 assert.equal(p.status,'EVIDENCE_DUE');
 assert.equal(p.ga4.status,'LATEST_COMPLETE_DAY_PROVIDER_ROWS_EMPTY');
 assert.equal(p.ga4.latestReportingDay,'2026-10-29');
 assert.equal(p.ga4.latestProviderRows,0);
 assert.equal(p.ga4.lastNonemptyDay,'2026-10-28');
 assert.equal(p.ga4.lastNonemptyProviderRows,1);
 assert.equal(p.ga4.lastNonemptyMatches,0);
 assert.equal(p.ga4.originalDataSpineState,'ORIGINAL_DATA_SPINE_STALE_OR_INCOMPLETE');
 assert.equal(p.ga4.hasVerifiedCurrentVisitors,false);
 assert.equal(p.prediction.status,'PUBLIC_ENGINE_IDLE_PRIVATE_FIRST_PARTY_PROOF_REQUIRED');
 assert.equal(p.prediction.publicDue,0);
 assert.equal(p.prediction.privateDue,2085);
 assert.equal(p.prediction.forecastDue,2005);
 assert.equal(p.prediction.forecastResolved,138);
 assert.equal(p.prediction.forecastResolutionDebt,1867);
 assert.equal(p.prediction.revenueFlywheelDueUncalibrated,1867);
 assert.equal(p.prediction.denominatorsDistinct,true);
 assert.equal(p.priorities.length,2);
 assert.equal(p.priorities[0].code,'GA4_REAL_SOURCE_REPORTING_AND_CONSENT');
 assert.equal(p.priorities[1].code,'PRIVATE_FIRST_PARTY_CALIBRATION_EVIDENCE');
 assert.equal(p.guards.noPrivateForecastToPublicModel,true);
 assert.equal(p.guards.noNegativeOutcomeFromSilence,true);
});
test('genuine recent GA4 rows with current source observation do not imply social attribution or paid buyers',()=>{
 const p=projectGa4PredictiveSourceRepair({...snapshot,
   ga4Batches:[{period_start:'2026-10-29',source:'google-analytics-data-api',
     completed_at:'2026-10-30T13:30:00Z',rows_total:3,rows_attributed:0,status:'PARTIAL'}],
   ga4Coverage:[{source_key:'ga4-analytics',last_observed_at:'2026-10-30T13:30:00Z',
    coverage_state:'fresh'}]});
 assert.equal(p.ga4.status,'GA4_ROWS_OBSERVED_ATTRIBUTION_SEPARATE');
 assert.equal(p.ga4.latestProviderRows,3);
 assert.equal(p.ga4.latestProviderMatches,0);
 assert.equal(p.ga4.originalDataSpineState,'SOURCE_OBSERVATION_FRESH');
 assert.equal(p.prediction.privateBuyerOrCompanyOutcomeVerified,false);
 assert.equal(p.status,'EVIDENCE_DUE','other private evidence remains due');
 assert.equal(p.priorities.length,1);
});
test('a completed zero-row daily report never gets a synthetic fresh observation',()=>{
 const p=projectGa4PredictiveSourceRepair({...snapshot,
   ga4Batches:[{period_start:'2026-10-29',source:'google-analytics-data-api',
     completed_at:'2026-10-30T14:00:00Z',rows_total:0,rows_attributed:0,status:'IMPORTED'}],
   ga4Coverage:[{source_key:'ga4-analytics',last_observed_at:'2026-10-30T13:50:00Z',
    coverage_state:'fresh'}]});
 assert.equal(p.ga4.status,'LATEST_COMPLETE_DAY_PROVIDER_ROWS_EMPTY');
 assert.equal(p.ga4.hasVerifiedCurrentVisitors,false);
 assert.equal(p.ga4.lastNonemptyDay,null);
 assert.equal(p.status,'EVIDENCE_DUE');
});
test('missing, too old, malformed or truncated sources remain UNVERIFIED rather than counted as zero',()=>{
 const absent=projectGa4PredictiveSourceRepair({at,readStates:{}});
 assert.equal(absent.ga4.latestProviderRows,null);
 assert.equal(absent.ga4.status,'PROVIDER_REPORT_READBACK_UNVERIFIED');
 assert.equal(absent.prediction.forecastDue,null);
 assert.equal(absent.prediction.publicDue,null);
 assert.equal(absent.prediction.privateDue,null);
 const old=projectGa4PredictiveSourceRepair({...snapshot,calibrationHealth:[
  {...snapshot.calibrationHealth[0],gemeten_op:'2026-10-29T06:00:00Z'}]});
 assert.equal(old.prediction.privateDue,null);
 const bad=projectGa4PredictiveSourceRepair({...snapshot,ga4Batches:[
  {period_start:'not-a-day',source:'unknown',rows_total:-1,completed_at:at}]});
 assert.equal(bad.ga4.latestReportingDay,null);
 const truncated=projectGa4PredictiveSourceRepair({...snapshot,readStates:{...states,ga4Batches:'TRUNCATED'}});
 assert.equal(truncated.ga4.status,'PROVIDER_REPORT_READBACK_UNVERIFIED');
});
test('original admin-only API and portal reuse all original publishers and avoid public private-LLM leakage',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const panel=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const skill=readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
 const handler=readFileSync('netlify/functions/_powerhouse-ga4-predictive-source-repair.mjs','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/ga4Batches:datasets\[21\]/);
 assert.match(api,/calibrationHealth:datasets\[23\]/);
 assert.match(panel,/data-one-brain-ga4-private-calibration-repair/);
 assert.match(skill,/POWERHOUSE_ONE_BRAIN_GA4_PRIVATE_CALIBRATION_REPAIR_V1/);
 assert.doesNotMatch(handler,/\bfetch\(|\bINSERT INTO|setInterval|cron\.schedule|private[_ ]?email/);
 assert.equal(projectOtherData({at,readStates:{}}).ga4PredictiveRepair.status,'EVIDENCE_DUE');
});
