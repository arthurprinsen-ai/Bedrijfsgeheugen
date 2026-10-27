import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  parseDeclaredChangeScope,evaluateSharedTerminalOwnership,evaluateAdmission
} from '../tools/delivery/delivery-hygiene.mjs';

const MAIN='a'.repeat(40),HEAD='b'.repeat(40),OTHER='c'.repeat(40);
const WF='.github/workflows/powerhouse-repository-janitor.yml';
const CONTROL='tools/delivery/recovery-supervisor-telemetry.mjs';
const policy={
  allowedLanes:['automation'],allowedCandidateTypes:['implementation','recovery'],
  nonProductLanes:[],wip:{maxExecutable:100}
};
const pr=(number,sha=HEAD,{state='TERMINAL_DELIVERY',paths=[WF,CONTROL],
  obligation='owner-'+number,extra=''}={})=>({
    number,state:'open',headSha:sha,baseSha:MAIN,changedPaths:paths,
    body:[
      'Parent-Issue: #4120','Obligation-ID: '+obligation,
      'Delivery-Lane: automation','Candidate-Type: implementation',
      'Base-SHA: '+MAIN,'Change-Scope: '+paths.join(', '),
      'Writer-Lease-State: '+state,
      'Writer-Lease-Owner: '+obligation,
      'Writer-Lease-Scope: automation/'+number,
      'Writer-Lease-Head: '+sha,
      'Writer-Lease-Main-Epoch: '+MAIN,
      'Writer-Lease-Obligation: '+obligation,
      'Writer-Lease-NonOwner-Action: READ_ONLY',
      extra
    ].join('\n')
});
test('two separate obligations cannot simultaneously own the same workflow or file',()=>{
  const canonical=pr(4792,OTHER),overlapping=pr(4793,HEAD);
  const blocked=evaluateAdmission({candidate:overlapping,openCandidates:[canonical],policy,currentMainSha:MAIN});
  assert.equal(blocked.ok,false);
  assert.equal(blocked.state,'BLOCKED_SHARED_TERMINAL_WRITER');
  assert.deepEqual(blocked.blockers.map(b=>b.pr_number),[4792]);
  assert.deepEqual(blocked.blockers[0].shared_paths,[WF,CONTROL].sort());
  assert.equal(blocked.blockers[0].exact_head_lease,true);
  const winner=evaluateSharedTerminalOwnership({candidate:canonical,openCandidates:[overlapping]});
  assert.equal(winner.ok,true);
  assert.equal(winner.state,'SINGLE_TERMINAL_WRITER_ADMITTED');
});
test('closed or retired #4792 does not block canonical #4793',()=>{
  const retired=pr(4792,OTHER,{extra:'Retirement-State: RETIRED_DO_NOT_MERGE'});
  const winner=pr(4793);
  assert.equal(evaluateSharedTerminalOwnership({candidate:winner,openCandidates:[retired]}).ok,true);
  const titleOnly=pr(3975,OTHER);titleOnly.title='RETIRED — terminal lease metadata drift after second in-place sync';
  assert.equal(evaluateSharedTerminalOwnership({candidate:winner,openCandidates:[titleOnly]}).ok,true);
  const closed=pr(4792,OTHER);closed.state='closed';
  assert.equal(evaluateSharedTerminalOwnership({candidate:winner,openCandidates:[closed]}).ok,true);
});
test('provider-authoritative changed filenames must be declared on current terminal lease',()=>{
  const candidate=pr(5100,HEAD,{paths:[CONTROL]});
  candidate.changedPaths=[CONTROL,WF];
  const proof=evaluateSharedTerminalOwnership({candidate,openCandidates:[]});
  assert.equal(proof.ok,false);
  assert.equal(proof.state,'BLOCKED_SHARED_WRITE_SCOPE_UNDERDECLARED');
  assert.deepEqual(proof.reasons,[WF]);
});
test('invalid scope and duplicate claimed ownership fail closed without new CI dispatch',()=>{
  assert.equal(parseDeclaredChangeScope('Change-Scope: ../secret').ok,false);
  assert.equal(parseDeclaredChangeScope('Change-Scope: '+WF+', '+WF).ok,false);
  const duplicate=pr(700);
  duplicate.body+='\nChange-Scope: '+WF;
  assert.equal(evaluateSharedTerminalOwnership({candidate:duplicate}).state,'BLOCKED_SHARED_WRITE_SCOPE_INVALID');
});
test('independent paths remain parallel and nonterminal agents cannot claim terminal authority',()=>{
  const a=pr(500,OTHER,{paths:['docs/learning/change-one.md']});
  const b=pr(501,HEAD,{paths:[CONTROL]});
  assert.equal(evaluateSharedTerminalOwnership({candidate:b,openCandidates:[a]}).ok,true);
  const constructing=pr(502,HEAD,{state:'CANDIDATE',paths:[WF,CONTROL]});
  const result=evaluateSharedTerminalOwnership({candidate:constructing,openCandidates:[a,b]});
  assert.equal(result.ok,true);
  assert.equal(result.state,'NONTERMINAL_NO_MUTATION_AUTHORITY');
});
test('the existing production gate obtains provider file lists; native CAS and protected CI remain',()=>{
  const admit=fs.readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
  const supervisor=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  const required=fs.readFileSync('.github/workflows/required-test.yml','utf8');
  assert.match(admit,/pulls\/\$\{prNumber\}\/files\?per_page=100/);
  assert.match(admit,/changedPaths,\n\s+conflictContracts: currentContracts/);
  assert.match(admit,/title: item\.title \|\| ''/);
  assert.match(supervisor,/expected_head_sha="\$head"/);
  assert.match(supervisor,/MAX_MAIN_DRIFT_REFRESHES: '2'/);
  assert.match(supervisor,/Writer-Lease-State: MAIN_SYNC/);
  assert.match(required,/merge_group:/);
  assert.match(required,/pull_request:/);
  assert.doesNotMatch(supervisor,/--force(?:\s|$)/);
});
