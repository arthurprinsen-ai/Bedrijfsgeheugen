import test from 'node:test';
import assert from 'node:assert/strict';
import { createCandidateIdentity, validateMachineReadablePrBody, scanStaticSecurity, evaluateBranchHygiene, evaluateTestWorkflowCoverage, evaluateTerminalMergeGuard } from '../tools/delivery/github-delivery-state-machine.mjs';
import policy from '../config/powerhouse-delivery-hygiene-v1.json' with { type: 'json' };

const A='a'.repeat(40), B='b'.repeat(40);
const body=(extra='')=>`Obligation-ID: obligation-1
Delivery-Lane: backend
Candidate-Type: implementation
Base-SHA: ${A}
Supersedes: none
Writer-Lease-State: TERMINAL_DELIVERY
Writer-Lease-Owner: agent-reliability
Writer-Lease-Scope: obligation-1
Writer-Lease-Head: ${B}
Writer-Lease-Main-Epoch: ${A}
Writer-Lease-Obligation: obligation-1
${extra}`;

test('identity is obligation + exact head + main epoch and never branch name',()=>{
  const id=createCandidateIdentity({obligationId:'obligation-1',headSha:B,mainEpochSha:A});
  assert.equal(id.key,`obligation-1:${B}:${A}`);
  assert.equal('branch' in id,false);
});

test('PR machine metadata is exact-once and terminal lease is lineage-bound',()=>{
  const valid=validateMachineReadablePrBody({body:body(),candidateHeadSha:B,currentMainSha:A,policy});
  assert.equal(valid.ok,true);
  const dup=validateMachineReadablePrBody({body:body('Obligation-ID: duplicate'),candidateHeadSha:B,currentMainSha:A,policy});
  assert.equal(dup.ok,false);
  assert.ok(dup.errors.includes('OBLIGATION_ID_DUPLICATE'));
  const drift=validateMachineReadablePrBody({body:body().replace(A,'c'.repeat(40)),candidateHeadSha:B,currentMainSha:A,policy});
  assert.equal(drift.ok,false);
});

test('cheap static gates fail closed on branch and secret leakage',()=>{
  assert.equal(evaluateBranchHygiene({headRef:'feature/x',baseRef:'main'}).ok,true);
  assert.equal(evaluateBranchHygiene({headRef:'main',baseRef:'main'}).ok,false);
  assert.equal(scanStaticSecurity('+ const token = "'+'ghp_'+'abcdefghijklmnopqrstuvwxyz123456";').ok,false);
  assert.equal(evaluateTestWorkflowCoverage({changedPaths:['tests/x.test.mjs'],classifiedLanes:[]}).ok,false);
  assert.equal(evaluateTestWorkflowCoverage({changedPaths:['tests/x.test.mjs'],classifiedLanes:['backend']}).ok,true);
});

test('terminal merge requires current epoch, exact validated head, green required checks and no successor',()=>{
  const ok=evaluateTerminalMergeGuard({body:body(),policy,candidateHeadSha:B,validatedHeadSha:B,currentMainSha:A,behindBy:0,mergeable:true,requiredChecks:[{name:'Required',conclusion:'success'}],openCandidates:[]});
  assert.equal(ok.ok,true);
  const behind=evaluateTerminalMergeGuard({body:body(),policy,candidateHeadSha:B,validatedHeadSha:B,currentMainSha:A,behindBy:1,mergeable:true,requiredChecks:[{name:'Required',conclusion:'success'}],openCandidates:[]});
  assert.equal(behind.ok,false);
  assert.ok(behind.reasons.includes('BEHIND_MAIN'));
});
