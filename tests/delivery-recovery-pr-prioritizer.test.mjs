import test from 'node:test';
import assert from 'node:assert/strict';
import {rankRecoveryCandidates} from '../tools/delivery/recovery-pr-prioritizer.mjs';
const A='a'.repeat(40),B='b'.repeat(40),C='c'.repeat(40);
const repo='arthurprinsen-ai/Bedrijfsgeheugen';
const now=Date.parse('2026-10-23T14:00:00Z');
function pr(number,{state='TERMINAL_DELIVERY',epoch=B,drift=0,head=A,fork=false,body=''}={}){
  return {number,state:'open',draft:false,updated_at:'2026-10-23T13:30:00Z',
    head:{sha:head,repo:{full_name:fork?'someone/fork':repo}},
    base:{repo:{full_name:repo}},
    body:['Writer-Lease-State: '+state,'Writer-Lease-Owner: owner-'+number,
      'Writer-Lease-Obligation: id-'+number,'Writer-Lease-Head: '+head,
      'Writer-Lease-Main-Epoch: '+epoch,'Writer-Lease-Drift-Refreshes: '+drift,
      'Base-SHA: '+epoch,body].join('\n')};
}
function run(number,{id=1,status='completed',conclusion='success',event='pull_request',head=A}={}){
  return {id,status,conclusion,event,head_sha:head,
    name:'Required test PR #'+number+' '+head,
    created_at:'2026-10-23T13:00:00Z',updated_at:'2026-10-23T13:02:00Z'};
}
const rank=(prs,runs=[])=>rankRecoveryCandidates({prs,requiredRuns:runs,repo,mainSha:C,now});
test('prioritizes only terminal-lease candidates and existing MAIN_SYNC',()=>{
  const prs=[pr(1,{state:'ACTIVE'}),pr(2),pr(3,{state:'MAIN_SYNC'}),pr(4,{epoch:C})];
  const before=structuredClone(prs),result=rank(prs);
  assert.deepEqual(result.ordered_prs.map(x=>x.number),[3,2,1,4]);
  assert.deepEqual(prs,before);
  assert.equal(result.safety.mutation_authority,false);
  assert.equal(result.safety.skip_required_or_codeql,false);
});
test('live exact-head Required run makes an idle PR higher priority',()=>{
  const result=rank([pr(15),pr(16)],[run(15,{status:'in_progress',conclusion:null})]);
  assert.deepEqual(result.ordered_prs.map(x=>x.number),[16,15]);
});
test('repeat same-head completed Required is diagnostic and cannot be skipped',()=>{
  const result=rank([pr(15)],[run(15),run(15,{id:2})]);
  assert.equal(result.potential_same_head_repeats,1);
  assert.equal(result.rankings[0].required_success_median_seconds,120);
  assert.equal(result.safety.can_claim_duplicate_runner_savings,false);
});
test('provider duplicate run ID cannot inflate apparent repeat waste',()=>{
  const result=rank([pr(15)],[run(15),run(15)]);
  assert.equal(result.potential_same_head_repeats,0);
});
test('fork, duplicate lease, exhausted drift and invalid head fail closed',()=>{
  const result=rank([pr(1,{fork:true}),pr(2,{body:'Writer-Lease-Obligation: duplicated'}),
    pr(3,{drift:2}),pr(4,{head:'invalid'}),pr(5)]);
  assert.equal(result.rankings[0].number,5);
  assert.ok(result.rankings.slice(1).every(x=>!x.lease_valid));
});
test('dispatch event and stale head do not prove same-head Required execution',()=>{
  const result=rank([pr(15)],[run(15,{event:'workflow_dispatch'}),run(15,{id:2,head:B})]);
  assert.equal(result.potential_same_head_repeats,0);
  assert.equal(result.rankings[0].required_success_median_seconds,null);
});
test('invalid snapshot or duplicate PR identity fails closed',()=>{
  assert.throws(()=>rank([pr(1),pr(1)]),/UNTRUSTED/);
  assert.throws(()=>rankRecoveryCandidates({prs:[],repo,mainSha:'bad'}),/UNTRUSTED/);
});
test('unrankable PRs preserve original default recovery order',()=>{
  assert.deepEqual(rank([pr(10,{state:'ACTIVE'}),pr(11,{state:'ACTIVE'})])
    .ordered_prs.map(p=>p.number),[10,11]);
});

test('MAIN_SYNC with the second bounded drift attempt still ranks for reconciliation',()=>{
  const x=rank([pr(10),pr(11,{state:'MAIN_SYNC',drift:2})]);
  assert.deepEqual(x.ordered_prs.map(p=>p.number),[11,10]);
  assert.equal(x.rankings[0].lease_valid,true);
  assert.equal(x.rankings[0].advisory_stage,'RECONCILE_EXISTING_MAIN_SYNC');
  assert.equal(x.safety.max_drift_refreshes,2);
  const excessive=rank([pr(11,{state:'MAIN_SYNC',drift:3}),pr(10)]);
  assert.equal(excessive.rankings.at(-1).lease_valid,false);
});
test('fresh exact-head Required success is advisory priority over old unobserved PR',()=>{
  const old={...pr(3120),updated_at:'2026-10-01T08:00:00Z'};
  const x=rank([old,pr(4789)],[run(4789),run(3120,{id:22,event:'workflow_dispatch'})]);
  assert.deepEqual(x.ordered_prs.map(p=>p.number),[4789,3120]);
  assert.equal(x.rankings[0].observed_completed_exact_head_required_success,true);
  assert.equal(x.rankings[1].observed_completed_exact_head_required_success,false);
  assert.equal(x.safety.skip_required_or_codeql,false);
});
test('unknown bounded Required evidence is not treated as failed; recent PRs get priority',()=>{
  const old={...pr(3120),updated_at:'2026-09-01T00:00:00Z'};
  const x=rank([old,pr(4789)],[]);
  assert.deepEqual(x.ordered_prs.map(p=>p.number),[4789,3120]);
  assert.equal(x.sample,'BOUNDED_GITHUB_REQUIRED_RUNS_NOT_FULL_CI_HISTORY');
  assert.ok(x.rankings.every(r=>r.observed_completed_exact_head_required_success===false));
});
test('an active exact-head Required check defers even after a previous successful run',()=>{
  const x=rank([pr(4789),pr(4798)],
    [run(4789),run(4789,{id:2,status:'queued',conclusion:null})]);
  assert.deepEqual(x.ordered_prs.map(p=>p.number),[4798,4789]);
  assert.equal(x.rankings[1].observed_active_required,true);
});
