import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const read=path=>readFileSync(path,'utf8');

test('the real growth-swarm incident skill no longer remains in stale loop debt',()=>{
  const policy=JSON.parse(read('brain/policies/powerhouse-incident-register-and-self-fix-v1.json'));
  const marker=policy.skill_protocol.marker;
  for(const skill of ['powerhouse-growth-swarm','powerhouse-netlify-production-truth','powerhouse-self-improvement-layer']){
    assert.ok(read('.agents/skills/'+skill+'/SKILL.md').includes(marker),skill+' really has original incident protocol');
    assert.ok(!policy.loop_debt_baseline.includes(skill),skill+' must not remain false debt');
  }
  assert.equal(new Set(policy.loop_debt_baseline).size,policy.loop_debt_baseline.length);
});

test('portal immutable app.js query equals current canonical system-map explanation digest',()=>{
  const html=read('portal-v2/index.html');
  const map=read('platform/system-map/canonical-system-map.mjs');
  const hash=map.match(/explanationInventory:Object\.freeze\(\{contract:'portal-explanation-autosync-v1',contentHash:'([a-f0-9]{64})'/)?.[1];
  assert.ok(hash);
  assert.ok(html.includes('./app.js?bg_explain='+hash));
  assert.equal((html.match(/\.\/app\.js\?bg_explain=/g)||[]).length,1);
});

test('original owner-only Portal shows observed BRAIN failure but never claims BRAIN success',()=>{
  const api=read('netlify/functions/powerhouse-cro-other-data.mjs');
  const ui=read('portal-v2/modules/andere-data.js');
  assert.match(api,/isPowerhouseAdmin/);
  assert.match(api,/brainBackendFailures:datasets\[28\]/);
  assert.match(api,/brain\|postmerge-backend-suite-34-failures\|20261102-v1/);
  assert.match(ui,/data-brain-original-backend-evidence/);
  assert.match(ui,/fouten en testbewijs/);
  const observed=projectOtherData({
    brainBackendFailures:[{
      fingerprint:'powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1',
      maturity:'OBSERVED',
      occurrence_count:1,
      evidence:{failed_tests:34,affected_test_files:30,brain_run:41406918918}
    }],
    readStates:{brainBackendFailures:'LIVE'}
  });
  assert.equal(observed.brainBackendRun.status,'BRAIN_BACKEND_FAILED');
  assert.equal(observed.brainBackendRun.failingTests,34);
  assert.equal(observed.brainBackendRun.affectedFiles,30);
  assert.equal(observed.brainBackendRun.verifiedPassed,false);
  assert.equal(observed.brainBackendRun.ordersIndependentlyProven,false);
  assert.equal(observed.brainBackendRun.noSecondExecutor,true);
  const missing=projectOtherData({readStates:{brainBackendFailures:'UNAVAILABLE'}});
  assert.equal(missing.brainBackendRun.status,'SOURCE_UNVERIFIED');
  assert.equal(missing.brainBackendRun.failingTests,null);
  const stale=projectOtherData({readStates:{brainBackendFailures:'TRUNCATED'},brainBackendFailures:[{},{}]});
  assert.equal(stale.brainBackendRun.status,'SOURCE_UNVERIFIED');
});

test('original register can show last recorded 0 BRAIN failures without claiming provider or revenue proof',()=>{
  const fingerprint='powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1';
  const base={fingerprint,maturity:'VALIDATED',evidence:{
    failed_tests:34,affected_test_files:30,brain_run:41406918918,
    software_recovery_20261102:{
      status:'SOFTWARE_BACKEND_0_FAILURES_VALIDATED',
      original_full_test_run:41430758451,
      full_backend_total:5392,full_backend_passed:5390,
      full_backend_failed:0,full_backend_skipped:2,
      protected_main_sha:'79d99ce9d03068dae3c909707d00dde1933f9d78',
      netlify_exact_sha_ready:true,
      netlify_production_deploy_id:'6ae8689d8166870bb317e761'
    }
  }};
  const read=entry=>projectOtherData({brainBackendFailures:[entry],readStates:{brainBackendFailures:'LIVE'}}).brainBackendRun;
  const observed=read(base);
  assert.equal(observed.status,'BRAIN_BACKEND_ZERO_RECORDED_NONTERMINAL');
  assert.equal(observed.failingTests,0);
  assert.equal(observed.historicalFailingTests,34);
  assert.equal(observed.latestRunId,41430758451);
  assert.equal(observed.latestGitHubEvidenceUrl,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41430758451');
  assert.equal(observed.verifiedPassed,false);
  assert.equal(observed.ordersIndependentlyProven,false);
  assert.equal(observed.naturalNoRecurrenceProven,false);
  assert.equal(observed.noSecondExecutor,true);
  for(const invalid of [
    {...base,evidence:{...base.evidence,software_recovery_20261102:{...base.evidence.software_recovery_20261102,full_backend_failed:null}}},
    {...base,evidence:{...base.evidence,software_recovery_20261102:{...base.evidence.software_recovery_20261102,full_backend_passed:5370}}},
    {...base,evidence:{...base.evidence,software_recovery_20261102:{...base.evidence.software_recovery_20261102,netlify_exact_sha_ready:false}}},
    {...base,evidence:{...base.evidence,software_recovery_20261102:{...base.evidence.software_recovery_20261102,protected_main_sha:'not-a-commit'}}},
    {...base,maturity:'OBSERVED'},
    {...base,evidence:{...base.evidence,latest_original_brain_run:{run_id:41439999999,fail:2,terminal_status:'FAILED_BRAIN'}}}
  ]){
    const projection=read(invalid);
    assert.notEqual(projection.status,'BRAIN_BACKEND_ZERO_RECORDED_NONTERMINAL');
    assert.equal(projection.verifiedPassed,false);
  }
});
