import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizeRecoveryEvents} from '../tools/delivery/recovery-supervisor-metrics.mjs';
test('unique drift, repeat, lease denial and CAS are counted separately without invented outcomes',()=>{
  const e=summarizeRecoveryEvents(['4781\tDRIFT_DETECTED\t0','4781\tDRIFT_DETECTED\t0','4781\tREPEATED_DRIFT\t1',
    '4781\tCAS_REQUEST\t2','4781\tCAS_ACCEPTED\t2','4781\tCAS_PROVEN\t2',
    '4782\tDRIFT_DETECTED\t0','4782\tLEASE_DENIED\t0','4783\tBUDGET_EXHAUSTED\t2','4784\tCAS_REJECTED\t1'].join('\n')+'\n',{runId:'123'});
  assert.equal(e.distinct_drift_prs,2);assert.equal(e.repeated_drift_prs,1);
  assert.equal(e.counts.CAS_PROVEN,1);assert.equal(e.counts.CAS_REJECTED,1);
  assert.equal(e.counts.LEASE_DENIED,1);assert.equal(e.counts.BUDGET_EXHAUSTED,1);
  assert.equal(e.time_to_green_ms,null);assert.equal(e.customer_outcome_verified,false);
  assert.equal(e.release_authorized,false);
});
test('failed run and open circuit cannot manufacture success',()=>{
  const e=summarizeRecoveryEvents('0\tCIRCUIT_OPEN\t0\n',{exitCode:1});
  assert.equal(e.supervisor_step_succeeded,false);assert.equal(e.source_snapshot_complete,false);
  assert.equal(e.counts.CIRCUIT_OPEN,1);
});
test('untrusted or excessive evidence fails closed',()=>{
  for(const row of ['1\tUNKNOWN\t0','junk\tDRIFT_DETECTED\t0','0\tCAS_PROVEN\t0','1\tCIRCUIT_OPEN\t0','1\tCAS_REQUEST\t-1'])
    assert.throws(()=>summarizeRecoveryEvents(row+'\n'),/INVALID/);
  assert.throws(()=>summarizeRecoveryEvents('1\tDRIFT_DETECTED\t0\n'.repeat(10001)),/TOO_MANY_ROWS/);
});
test('sole Recovery Supervisor retains native CAS, one writer and protected delivery',()=>{
  const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.equal((y.match(/^name: Powerhouse Delivery Recovery Supervisor$/gm)||[]).length,1);
  assert.equal((y.match(/^jobs:$/gm)||[]).length,1);
  assert.match(y,/cancel-in-progress: false/);
  assert.match(y,/RECOVERY_PR_BUDGET: '1'/);assert.match(y,/MAX_MAIN_DRIFT_REFRESHES: '2'/);
  assert.match(y,/expected_head_sha="\$head"/);
  for(const type of ['DRIFT_DETECTED','LEASE_DENIED','REPEATED_DRIFT','CAS_REQUEST','CAS_ACCEPTED','CAS_PROVEN','CAS_REJECTED'])
    assert.ok(y.includes(' '+type+' '),type);
  assert.match(y,/node tools\/delivery\/recovery-supervisor-metrics\.mjs/);
  assert.match(y,/actions\/upload-artifact@v4/);
  assert.doesNotMatch(y,/--method POST "repos\/\$repo\/merges"/);
});

test('a green run with no drift events is not a complete repository scan',()=>{
  const e=summarizeRecoveryEvents('',{runId:'39966378899',exitCode:0});
  assert.equal(e.supervisor_step_succeeded,true);
  assert.equal(e.counts.DRIFT_DETECTED,0);
  assert.equal(e.source_snapshot_complete,false);
  assert.equal(e.coverage_state,'PARTIAL_OR_UNPROVEN');
  assert.equal(e.eligible_pr_denominator,null);
  assert.equal(e.classified_pr_denominator,null);
  assert.equal(e.zero_drift_global_claim_allowed,false);
});
test('partial scan with actual CAS evidence still cannot certify global absence of drift',()=>{
  const e=summarizeRecoveryEvents('4781\tCAS_PROVEN\t1\n',{exitCode:0});
  assert.equal(e.counts.CAS_PROVEN,1);
  assert.equal(e.source_snapshot_complete,false);
  assert.equal(e.coverage_state,'PARTIAL_OR_UNPROVEN');
});
