import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(r.action,'CREATE_SUCCESSOR_FROM_CURRENT_MAIN');
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

test('predictive scheduler never rewrites a terminal lease and creates successor on epoch drift',()=>{
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
  assert.equal(stale.action,'CREATE_SUCCESSOR_FROM_CURRENT_MAIN');
});
