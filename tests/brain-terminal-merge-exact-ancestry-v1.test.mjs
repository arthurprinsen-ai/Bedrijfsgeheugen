import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTerminalMergeGuard } from '../tools/delivery/github-delivery-state-machine.mjs';
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

test('terminal merge refuses absent or malformed exact provider ancestry and SHA evidence',()=>{
  const input={body:body(),policy,candidateHeadSha:B,validatedHeadSha:B,currentMainSha:A,behindBy:0,mergeable:true,requiredChecks:[{name:'Required',conclusion:'success'}],openCandidates:[]};
  assert.equal(evaluateTerminalMergeGuard(input).ok,true);
  for(const behindBy of [null,undefined,'', '0',false,[],{},NaN,Infinity,-1,0.5]){
    const result=evaluateTerminalMergeGuard({...input,behindBy});
    assert.equal(result.ok,false);
    assert.ok(result.reasons.includes('MAIN_ANCESTRY_UNVERIFIED'));
  }
  for(const field of ['candidateHeadSha','validatedHeadSha','currentMainSha']){
    for(const invalid of ['',null,'not-a-sha']){
      const result=evaluateTerminalMergeGuard({...input,[field]:invalid});
      assert.equal(result.ok,false,field);
    }
  }
  const noIdentity=evaluateTerminalMergeGuard({...input,candidateHeadSha:'',validatedHeadSha:'',currentMainSha:''});
  assert.equal(noIdentity.ok,false);
  assert.equal(noIdentity.identity,null);
});
