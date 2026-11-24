import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { evaluateTerminalBranchWriteGuard } from '../tools/delivery/github-delivery-state-machine.mjs';
import { planConcurrentAgentWork } from '../tools/delivery/predictive-controller.mjs';

const A='a'.repeat(40);
const B='b'.repeat(40);
const C='c'.repeat(40);

const terminalBody=`Obligation-ID: terminal-writer-cas
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: ${A}
Writer-Lease-State: TERMINAL_DELIVERY
Writer-Lease-Owner: canonical-writer
Writer-Lease-Scope: terminal-writer-cas
Writer-Lease-Head: ${B}
Writer-Lease-Main-Epoch: ${A}
Writer-Lease-Obligation: terminal-writer-cas
`;

test('terminal-delivery candidate content is immutable even when head and main still match',()=>{
  const r=evaluateTerminalBranchWriteGuard({
    body:terminalBody,
    observedHeadSha:B,
    expectedHeadSha:B,
    capturedMainEpochSha:A,
    currentMainSha:A,
    obligationId:'terminal-writer-cas',
    mutationKind:'content'
  });
  assert.equal(r.ok,false);
  assert.equal(r.canMutateCandidate,false);
  assert.equal(r.action,'CREATE_SUCCESSOR_FROM_CURRENT_MAIN');
  assert.ok(r.reasons.includes('TERMINAL_CANDIDATE_IMMUTABLE'));
});

test('terminal-delivery metadata/readback remains allowed under exact CAS identity',()=>{
  const r=evaluateTerminalBranchWriteGuard({
    body:terminalBody,
    observedHeadSha:B,
    expectedHeadSha:B,
    capturedMainEpochSha:A,
    currentMainSha:A,
    obligationId:'terminal-writer-cas',
    mutationKind:'metadata'
  });
  assert.equal(r.ok,true);
  assert.equal(r.action,'ALLOW_COMPARE_AND_SWAP_WRITE');
});

test('pre-terminal write fails closed when captured main epoch is stale',()=>{
  const r=evaluateTerminalBranchWriteGuard({
    body:'Obligation-ID: terminal-writer-cas',
    observedHeadSha:B,
    expectedHeadSha:B,
    capturedMainEpochSha:A,
    currentMainSha:C,
    obligationId:'terminal-writer-cas',
    mutationKind:'content'
  });
  assert.equal(r.ok,false);
  assert.equal(r.action,'REVALIDATE_AND_SYNC_EXISTING_CANDIDATE');
  assert.ok(r.reasons.includes('CAPTURED_MAIN_EPOCH_STALE'));
});

test('head compare-and-swap mismatch is blocked without rewriting the branch',()=>{
  const r=evaluateTerminalBranchWriteGuard({
    body:'Obligation-ID: terminal-writer-cas',
    observedHeadSha:C,
    expectedHeadSha:B,
    capturedMainEpochSha:A,
    currentMainSha:A,
    obligationId:'terminal-writer-cas',
    mutationKind:'content'
  });
  assert.equal(r.ok,false);
  assert.equal(r.action,'BLOCK_STALE_WRITE');
  assert.ok(r.reasons.includes('EXPECTED_HEAD_CAS_MISMATCH'));
});

test('predictive scheduler keeps the same terminal lineage on epoch drift',()=>{
  const stable=planConcurrentAgentWork({
    obligationId:'terminal-writer-cas',
    currentHead:B,
    currentMain:A,
    writerLease:{state:'TERMINAL_DELIVERY',headSha:B,mainEpochSha:A},
    queue:{inProgress:0},
    projectedNewRuns:0
  });
  assert.equal(stable.canMutateCandidate,false);
  assert.equal(stable.action,'DO_NOT_REWRITE_TERMINAL_CANDIDATE');

  const stale=planConcurrentAgentWork({
    obligationId:'terminal-writer-cas',
    currentHead:B,
    currentMain:C,
    writerLease:{state:'TERMINAL_DELIVERY',headSha:B,mainEpochSha:A},
    queue:{inProgress:0},
    projectedNewRuns:0
  });
  assert.equal(stale.canMutateCandidate,false);
  assert.equal(stale.action,'REVALIDATE_ZERO_OVERLAP_AND_SYNC_EXISTING_CANDIDATE');
});


test('zero-overlap terminal main sync requires prior MAIN_SYNC lease readback',()=>{
  const r=evaluateTerminalBranchWriteGuard({
    body:terminalBody,
    observedHeadSha:B,
    expectedHeadSha:B,
    capturedMainEpochSha:A,
    currentMainSha:C,
    obligationId:'terminal-writer-cas',
    mutationKind:'main-sync',
    mainSyncOverlap:[],
    mainSyncContractOverlap:[]
  });
  assert.equal(r.ok,false);
  assert.equal(r.state,'MAIN_SYNC_LEASE_ACQUISITION_REQUIRED');
  assert.equal(r.action,'ACQUIRE_AND_READBACK_MAIN_SYNC_LEASE');
  assert.equal(r.canMutateCandidate,false);
});

test('main sync with overlap stays on the same lineage but requires reconciliation',()=>{
  const r=evaluateTerminalBranchWriteGuard({
    body:terminalBody,
    observedHeadSha:B,
    expectedHeadSha:B,
    capturedMainEpochSha:A,
    currentMainSha:C,
    obligationId:'terminal-writer-cas',
    mutationKind:'main-sync',
    mainSyncOverlap:['.github/workflows/required-test.yml']
  });
  assert.equal(r.ok,false);
  assert.equal(r.state,'SAME_LINEAGE_RECONCILIATION_REQUIRED');
  assert.equal(r.action,'RECONCILE_EXISTING_CANDIDATE_OR_PROVE_UNSYNCHRONIZABLE');
  assert.ok(r.reasons.includes('MAIN_SYNC_OVERLAP_REQUIRES_RECONCILIATION'));
});

const mainSyncBody=terminalBody.replace('TERMINAL_DELIVERY','MAIN_SYNC').replace('Writer-Lease-Main-Epoch: '+A,'Writer-Lease-Main-Epoch: '+C);
const syncArgs={body:mainSyncBody,observedHeadSha:B,expectedHeadSha:B,capturedMainEpochSha:C,currentMainSha:C,obligationId:'terminal-writer-cas',expectedOwner:'canonical-writer',mutationKind:'main-sync',mainSyncOverlap:[],mainSyncContractOverlap:[]};
test('exact MAIN_SYNC lease admits same-head native CAS, not content writes',()=>{
  assert.equal(evaluateTerminalBranchWriteGuard(syncArgs).state,'SAME_LINEAGE_MAIN_SYNC_ADMITTED');
  assert.equal(evaluateTerminalBranchWriteGuard({...syncArgs,mutationKind:'content'}).ok,false);
});
test('stale target, changed head, wrong owner, missing overlap evidence and duplicate metadata deny native CAS',()=>{
  for(const patch of [{currentMainSha:A},{observedHeadSha:C},{expectedOwner:'foreign'},{mainSyncOverlap:undefined},{mainSyncContractOverlap:['shared-contract']},{body:mainSyncBody+'Writer-Lease-Head: '+B+'\n'}]){
    assert.equal(evaluateTerminalBranchWriteGuard({...syncArgs,...patch}).ok,false,JSON.stringify(patch));
  }
});

test('existing recovery supervisor verifies comparisons and contracts, then calls guard before provider CAS',()=>{
  const source=readFileSync(new URL('../.github/workflows/powerhouse-delivery-recovery-supervisor.yml',import.meta.url),'utf8');
  const start=source.indexOf('MERGE_CONFLICT_RECOVERY|MAIN_DRIFT_RECOVERY)');
  const part=source.slice(start);
  const compare=part.indexOf('MAIN_SYNC_COMPARE_UNAVAILABLE');
  const incomplete=part.indexOf('MAIN_SYNC_COMPARE_INCOMPLETE');
  const shared=part.indexOf('MAIN_SYNC_CONTRACT_OVERLAP');
  const acquired=part.indexOf('pre_sync_body=');
  const readback=part.indexOf('guard_pr=');
  const guard=part.indexOf('terminal-write-guard --input /tmp/main-sync-prewrite.json');
  const cas=part.indexOf('/update-branch');
  assert.ok(start>=0 && compare>=0 && compare<incomplete && incomplete<shared && shared<acquired && acquired<readback && readback<guard && guard<cas);
  assert.match(part,/previous_filename/);
  assert.match(part,/deriveHygieneConflictContracts/);
});
