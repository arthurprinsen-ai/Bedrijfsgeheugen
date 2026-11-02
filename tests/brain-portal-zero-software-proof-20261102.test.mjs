import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const originalEvidence={
  failed_tests:32,baseline_failed_tests:34,affected_test_files:28,brain_run:41406918918,
  latest_original_brain_run:{run_id:41422715260,fail:23,terminal_status:'FAILED_BRAIN'},
  software_recovery_20261102:{
    status:'SOFTWARE_BACKEND_0_FAILURES_VALIDATED',
    full_software_test_status:'PASS',
    full_backend_total:5392,full_backend_passed:5390,full_backend_failed:0,
    full_backend_skipped:2,original_full_test_run:41430758451,
    original_backend_job:125229059857,
    protected_main_sha:'79d99ce9d03068dae3c909707d00dde1933f9d78',
    netlify_production_deploy_id:'6ae8689d8166870bb317e761',
    netlify_exact_sha_ready:true,actual_business_outcome_proven:false,
    natural_no_recurrence_proven:false
  }
};
const observed=(evidence=originalEvidence)=>projectOtherData({
  brainBackendFailures:[{
    fingerprint:'powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1',
    maturity:'VALIDATED',occurrence_count:5,evidence
  }],readStates:{brainBackendFailures:'LIVE'}
}).brainBackendRun;

test('portal reads the real original 5,392-test software recovery without deleting red history',()=>{
 const result=observed();
 assert.equal(result.status,'BRAIN_BACKEND_FAILED','historical incident remains visible');
 assert.equal(result.historicalFailingTests,32);
 assert.equal(result.failingTests,23);
 assert.equal(result.latestRunId,41422715260);
 assert.equal(result.softwareRecovery.status,'ORIGINAL_SOFTWARE_PASS_RECORDED');
 assert.deepEqual([
  result.softwareRecovery.totalTests,result.softwareRecovery.passedTests,
  result.softwareRecovery.failedTests,result.softwareRecovery.skippedTests
 ],[5392,5390,0,2]);
 assert.equal(result.softwareRecovery.originalRunId,41430758451);
 assert.equal(result.softwareRecovery.originalRunUrl,
  'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41430758451');
 assert.equal(result.softwareRecovery.independentlyVerifiedInThisPortal,false);
 assert.equal(result.softwareRecovery.noRecurrenceProven,false);
 assert.equal(result.verifiedPassed,false);
 assert.equal(result.ordersIndependentlyProven,false);
});

test('missing or forged zero-failure registry evidence never becomes a green result',()=>{
 const samples=[
  null,{}, {status:'SOFTWARE_BACKEND_0_FAILURES_VALIDATED'},
  {...originalEvidence.software_recovery_20261102,full_backend_total:5391},
  {...originalEvidence.software_recovery_20261102,full_backend_failed:null},
  {...originalEvidence.software_recovery_20261102,full_backend_passed:5391},
  {...originalEvidence.software_recovery_20261102,original_full_test_run:41430758450},
  {...originalEvidence.software_recovery_20261102,protected_main_sha:'0'.repeat(40)},
  {...originalEvidence.software_recovery_20261102,natural_no_recurrence_proven:true},
  {...originalEvidence.software_recovery_20261102,actual_business_outcome_proven:true}
 ];
 for(const sample of samples){
  const result=observed({...originalEvidence,software_recovery_20261102:sample});
  assert.equal(result.softwareRecovery.status,'SOFTWARE_RECOVERY_SOURCE_UNVERIFIED');
  assert.equal(result.softwareRecovery.failedTests,null);
  assert.equal(result.softwareRecovery.originalRunUrl,null);
  assert.equal(result.verifiedPassed,false);
 }
 const unavailable=projectOtherData({readStates:{brainBackendFailures:'UNAVAILABLE'}}).brainBackendRun;
 assert.equal(unavailable.softwareRecovery.status,'SOFTWARE_RECOVERY_SOURCE_UNVERIFIED');
});

test('original admin-only portal keeps historical failure and separate escaped absolute proof URL',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/software_recovery_20261102/);
 assert.match(api,/independentlyVerifiedInThisPortal:false/);
 assert.match(ui,/Geregistreerde latere BRAIN-herstelproef/);
 assert.match(ui,/Laatste vastgelegde mislukte BRAIN-run/);
 assert.match(ui,/brainBackend\.softwareRecovery\.originalRunUrl/);
 assert.match(ui,/href="'\+esc\(brainBackend\.softwareRecovery\.originalRunUrl\)/);
 assert.match(ui,/natuurlijke herhaling, klantwaarde of omzet/);
 assert.doesNotMatch(ui,/href="\.\/actions\/runs/);
});
