import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const source={fingerprint:'powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1',
 maturity:'VALIDATED',evidence:{failed_tests:34,affected_test_files:30,brain_run:41406918918,
 second_full_brain_run:{run_id:41409216287,fail:32,pass:5318,tests_total:5352,terminal_status:'FAILED_BRAIN'}}};
const p=(row=source)=>projectOtherData({brainBackendFailures:[row],readStates:{brainBackendFailures:'LIVE'}}).brainBackendRun;

test('original BRAIN history stays visible with latest source-registered 32-failure rerun',()=>{
 const result=p();
 assert.equal(result.historicalFailingTests,34);
 assert.equal(result.failingTests,32);
 assert.equal(result.affectedFiles,30);
 assert.equal(result.latestRunId,41409216287);
 assert.equal(result.latestMeasurementKind,'REGISTERED_ORIGINAL_GITHUB_RUN');
 assert.equal(result.latestGitHubEvidenceUrl,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41409216287');
 assert.equal(result.status,'BRAIN_BACKEND_FAILED');
 assert.equal(result.verifiedPassed,false);
 assert.equal(result.ordersIndependentlyProven,false);
});

test('future original incident observer may use stable latest_original_brain_run without changing Portal',()=>{
 const improved={...source,evidence:{...source.evidence,
 latest_original_brain_run:{run_id:41410000000,fail:17,terminal_status:'FAILED_BRAIN'}}};
 const result=p(improved);
 assert.equal(result.failingTests,17);
 assert.equal(result.historicalFailingTests,34);
 assert.equal(result.latestRunId,41410000000);
 assert.equal(result.verifiedPassed,false);
});

test('invalid source claims never fabricate a run, success or missing-baseline zero',()=>{
 for(const malformed of [{run_id:'javascript:alert(1)',fail:0,terminal_status:'FAILED_BRAIN'},
   {run_id:41409216287,fail:-5,terminal_status:'FAILED_BRAIN'},
   {run_id:41409216287,fail:null,terminal_status:'FAILED_BRAIN'},
   {run_id:41409216287,fail:'',terminal_status:'FAILED_BRAIN'},
   {run_id:41409216287,terminal_status:'FAILED_BRAIN'},
   {run_id:41409216287,fail:0,terminal_status:'SUCCESS'}]){
  const result=p({...source,evidence:{...source.evidence,second_full_brain_run:malformed}});
  assert.equal(result.failingTests,34);
  assert.equal(result.latestRunId,null);
  assert.equal(result.latestGitHubEvidenceUrl,null);
  assert.equal(result.verifiedPassed,false);
 }
 const unavailable=projectOtherData({readStates:{brainBackendFailures:'UNAVAILABLE'}}).brainBackendRun;
 assert.equal(unavailable.status,'SOURCE_UNVERIFIED');
 assert.equal(unavailable.failingTests,null);
});

test('the original owner-only Portal separates historical failure, latest failed run and later recovery with safe GitHub href',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/latest_original_brain_run/);
 assert.match(ui,/Eerste vastgelegde BRAIN-fouten/);
 assert.match(ui,/Laatste vastgelegde mislukte BRAIN-run/);
 assert.match(ui,/Geregistreerde latere BRAIN-herstelproef/);
 assert.match(ui,/brainBackend\.softwareRecovery\?\.failedTests===0/);
 assert.match(ui,/brainBackend\.softwareRecovery\?\.originalRunUrl/);
 assert.match(ui,/rel="noopener noreferrer"/);
 assert.match(ui,/esc\(brainBackend\.latestGitHubEvidenceUrl\)/);
 assert.match(ui,/geen onafhankelijke terminalafsluiting/);
});
