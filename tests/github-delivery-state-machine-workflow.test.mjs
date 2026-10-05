import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hygiene=fs.readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
const unified=fs.readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
const terminalizer=fs.readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
const requiredTest=fs.readFileSync('.github/workflows/required-test.yml','utf8');
const policy=JSON.parse(fs.readFileSync('config/powerhouse-delivery-hygiene-v1.json','utf8'));
const stateMachine=JSON.parse(fs.readFileSync('config/powerhouse-github-delivery-state-machine-v1.json','utf8'));

test('cheap admission gates execute before expensive Unified Brain lanes',()=>{
  for(const token of ['validateMachineReadablePrBody','evaluateBranchHygiene','createDeliveryPlan','evaluateTestWorkflowCoverage','scanStaticSecurity','evaluateWriterLease']){
    assert.match(hygiene,new RegExp(token));
  }
  assert.match(unified,/needs:\s*\[candidate-identity, admission\]/);
  assert.match(unified,/if:\s*needs\.admission\.outputs\.admitted == 'true'/);
});

test('terminal landing is exact-head main-epoch CAS and branch name is secondary',()=>{
  assert.match(unified,/Writer-Lease-Main-Epoch/);
  assert.match(unified,/Writer-Lease-Obligation/);
  assert.match(unified,/terminal-guard --input/);
  assert.match(unified,/fullCheckRuns:runs\.map/);
  assert.match(unified,/legacyStatuses:statuses\.map/);
  assert.match(unified,/x\.app\?\.slug/);
  assert.match(unified,/BG169_MAIN_EPOCH_DRIFT/);
  assert.match(unified,/-f sha="\$HEAD_SHA"/);
  assert.doesNotMatch(unified,/PR_HEAD_REF_DRIFT/);
  assert.doesNotMatch(unified,/BG169_HEAD_REF_DRIFT/);
});

test('post-merge terminalization is lineage-driven and independent of branch naming',()=>{
  assert.match(terminalizer,/Writer-Lease-State: TERMINAL_DELIVERY/);
  assert.match(terminalizer,/Re-verify exact candidate full commit check set/);
  assert.match(terminalizer,/evaluateFullCommitCheckSet/);
  assert.match(terminalizer,/EXACT_HEAD_CHECKSET_GREEN/);
  assert.match(terminalizer,/exact_head_full_checkset:true/);
  assert.match(terminalizer,/security_checkset:true/);
  assert.match(terminalizer,/powerhouse-skill-projection\.mjs/);
  assert.match(terminalizer,/chat-learning-preflight\.mjs/);
  assert.match(terminalizer,/terminal_status:'LIVE_BEWEZEN'/);
  assert.match(terminalizer,/production_sha/);
  assert.doesNotMatch(terminalizer,/startsWith\(github\.event\.pull_request\.head\.ref/);
});

test('product WIP and canonical policy match the desired steady state',()=>{
  assert.equal(policy.wip.maxExecutable,3);
  assert.equal(stateMachine.wip.maxActiveProductPrs,3);
  assert.equal(stateMachine.wip.maxTerminalWritersPerObligation,1);
  assert.equal(stateMachine.wip.maintenanceQueueSeparate,true);
  assert.deepEqual(stateMachine.identity.primary,['obligation_id','candidate_head_sha','main_epoch_sha']);
});


test('required preflight uses live PR metadata and fails closed on head drift',()=>{
  assert.match(requiredTest,/LIVE_PR_METADATA_READBACK_FAILED/);
  assert.match(requiredTest,/PR_HEAD_MOVED_DURING_PREFLIGHT/);
  assert.match(requiredTest,/api\.github\.com\/repos\/\$\{process\.env\.GITHUB_REPOSITORY_NAME\}\/pulls/);
  assert.match(requiredTest,/\.delivery-live-pr-body\.txt/);
  assert.match(requiredTest,/export PR_BODY="\$\(cat \.delivery-live-pr-body\.txt\)"/);
});
