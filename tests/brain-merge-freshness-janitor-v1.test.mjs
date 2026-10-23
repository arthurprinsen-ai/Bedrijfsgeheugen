import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessObservedMergeFreshness} from '../tools/delivery/ci-merge-freshness.mjs';

const MAIN='a'.repeat(40),SHA1='b'.repeat(40),SHA2='c'.repeat(40),SHA3='d'.repeat(40);
const pr=(number,sha,body='Obligation-ID: delivery|one|v1',other={})=>({
  number,state:'open',head:{sha},title:'safe PR #'+number,body,draft:false,...other
});
const c=(number,sha,status,ahead,behind,uniqueCommits=ahead>0)=>({
  number,headSha:sha,uniqueCommits,
  compareEvidence:{status,ahead_by:ahead,behind_by:behind,total_commits:ahead+behind}
});
function fixture(){
  const openPrs=[
    pr(101,SHA1),
    pr(102,SHA2,'Obligation-ID: delivery|two|v1'),
    pr(103,SHA3,'Obligation-ID: retired|v1',{title:'RETIRED — old candidate'})
  ];
  const snapshot={
    main_epoch_sha:MAIN,open_pr_count:3,
    candidates:[c(101,SHA1,'diverged',2,3),c(102,SHA2,'ahead',1,0),
      {number:103,headSha:SHA3,uniqueCommits:true,compareEvidence:{status:'UNPROVEN'}}]
  };
  return {mainSha:MAIN,openPrs,snapshot};
}

test('one immutable main epoch gives reviewable drift, not verified green or unauthorized refresh',()=>{
  const result=assessObservedMergeFreshness(fixture());
  assert.equal(result.status,'OBSERVED_COMMIT_DRIFT_ADVISORY_ONLY');
  assert.equal(result.sampled_open_prs,3);
  assert.equal(result.drifted_active_prs,1);
  assert.deepEqual(result.candidate_refresh_reviews.map(x=>x.pr_number),[101]);
  assert.equal(result.candidate_refresh_reviews[0].behind_commits,3);
  assert.equal(result.candidate_refresh_reviews[0].main_epoch_sha,MAIN);
  assert.equal(result.candidate_refresh_reviews[0].owner_resolution_required,false);
  assert.equal(result.candidate_refresh_reviews[0].refresh_admission,'BLOCK_UNTIL_EXACT_HEAD_CHECKS_AND_ONE_WRITER_VERIFIED');
  assert.equal(result.exact_head_checks_verified,false);
  assert.equal(result.may_update_branch,false);
  assert.equal(result.may_dispatch_ci,false);
  assert.equal(result.may_merge,false);
});

test('stale main epoch, altered PR head, duplicate PR, truncated list and contradictory counts fail closed',()=>{
  const original=fixture();
  const cases=[
    {...original,mainSha:'f'.repeat(40)},
    {...original,snapshot:{...original.snapshot,main_epoch_sha:'f'.repeat(40)}},
    {...original,snapshot:{...original.snapshot,open_pr_count:2}},
    {...original,openPrs:original.openPrs.slice(0,2)},
    {...original,openPrs:[original.openPrs[0],original.openPrs[0],original.openPrs[2]]},
    {...original,snapshot:{...original.snapshot,candidates:[
      {...original.snapshot.candidates[0],headSha:SHA2},...original.snapshot.candidates.slice(1)]}},
    {...original,snapshot:{...original.snapshot,candidates:[
      c(101,SHA1,'diverged',2,0),...original.snapshot.candidates.slice(1)]}},
    {...original,snapshot:{...original.snapshot,candidates:[
      {...c(101,SHA1,'diverged',2,3),uniqueCommits:false},...original.snapshot.candidates.slice(1)]}}
  ];
  for(const entry of cases){
    const x=assessObservedMergeFreshness(entry);
    assert.match(x.status,/^WITHHELD_/);
    assert.deepEqual(x.candidate_refresh_reviews,[]);
    assert.equal(x.may_update_branch,false);
  }
});

test('two active heads of same obligation remain an explicit single-writer conflict',()=>{
  const data=fixture();
  data.openPrs[1].body=data.openPrs[0].body;
  data.snapshot.candidates[1]=c(102,SHA2,'diverged',1,4);
  const result=assessObservedMergeFreshness(data);
  assert.equal(result.drifted_active_prs,2);
  assert.deepEqual(result.recorded_obligations_with_multiple_open_writers.map(x=>x.pr_numbers),[[101,102]]);
  assert.deepEqual(result.candidate_refresh_reviews.map(x=>x.pr_number),[102,101]);
  assert.ok(result.candidate_refresh_reviews.every(x=>x.multiple_open_writers&&x.refresh_admission.startsWith('BLOCK_')));
  assert.equal(result.may_merge,false);
});

test('drafts, retired heads and already-contained branches never become refresh candidates',()=>{
  const data=fixture();
  data.openPrs[0].draft=true;
  data.snapshot.candidates[1]=c(102,SHA2,'identical',0,0,false);
  const report=assessObservedMergeFreshness(data);
  assert.equal(report.status,'OBSERVED_COMMIT_DRIFT_ADVISORY_ONLY');
  assert.equal(report.drifted_active_prs,0);
  assert.deepEqual(report.candidate_refresh_reviews,[]);
});

test('GitHub Janitor reuses same hourly schedule, pins SHA compare, no new CI dispatch or gate bypass',()=>{
  const yaml=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  assert.match(yaml,/cron: '17 \* \* \* \*'/);
  assert.match(yaml,/compare\/\$\{process.env.GITHUB_SHA\}\.\.\.\$\{pr.head.sha\}/);
  assert.match(yaml,/main_epoch_sha:process.env.GITHUB_SHA/);
  assert.match(yaml,/node tools\/delivery\/ci-merge-freshness\.mjs/);
  assert.match(yaml,/\.artifacts\/powerhouse-merge-freshness\.json/);
  assert.match(yaml,/continue-on-error: true/);
  assert.equal((yaml.match(/^\s+- cron:/gm)||[]).length,1);
});
