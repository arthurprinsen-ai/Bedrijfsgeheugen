import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {observeRequiredHeadChurn} from '../tools/delivery/ci-required-head-churn.mjs';
import {collectObservedCiThroughput} from '../tools/delivery/ci-throughput-telemetry.mjs';

const NOW = Date.parse('2026-10-23T11:20:00Z');
const at = ms => new Date(NOW - ms).toISOString();
const sha = n => n.toString(16).padStart(40,'0');
const required = (id,pr,head,{attempt=1,event='pull_request',status='completed',when=at(id*1000)}={}) => ({
  id,run_attempt:attempt,event,status,head_sha:head,
  name:`Required test PR #${pr} ${head}`,created_at:when
});
const assess = (rows, totalCount=rows.length) =>
  observeRequiredHeadChurn({workflowRuns:rows,totalCount,now:NOW});

test('two recent PRs with independently observed candidate HEADs lead to read-only merge queue review',()=>{
  // Representative of observed #4765/#4761 required-run head churn; no claim of waste or causality.
  const rows=[
    required(1,4765,sha(1)),required(2,4765,sha(2)),required(3,4765,sha(3)),
    required(4,4761,sha(4)),required(5,4761,sha(5)),required(6,4761,sha(6))
  ];
  const r=assess(rows,40000);
  assert.equal(r.status,'SAMPLED_REPEATED_CANDIDATE_HEADS_NOT_CAUSAL');
  assert.equal(r.pr_count_with_repeated_heads,2);
  assert.equal(r.additional_head_versions_lower_bound,4);
  assert.equal(r.provider_history_truncated,true);
  assert.equal(r.repeated_prs[0].distinct_candidate_heads_observed,3);
  assert.equal(r.repeated_prs[1].distinct_candidate_heads_observed,3);
  assert.equal(r.merge_queue_advice,'EVALUATE_GITHUB_NATIVE_MERGE_QUEUE_WITH_ADMIN_AFTER_BASELINE');
  assert.equal(r.automatic_merge_queue_enablement,false);
  assert.equal(r.deployment_speedup_proven,false);
  assert.equal(r.causation_proven,false);
});

test('reruns of the SAME head, different jobs, and merge group events cannot fabricate new PR heads',()=>{
  const h=sha(31), other=sha(32);
  const rows=[
    required(1,21,h),required(2,21,h,{attempt:2}),
    required(3,21,h,{event:'merge_group'}),
    {...required(4,21,h),name:'CodeQL javascript-typescript'},
    {...required(5,21,h),name:`Required test PR #22 ${other}`},
    required(6,22,other)
  ];
  const r=assess(rows);
  assert.equal(r.pr_count_with_repeated_heads,0);
  assert.equal(r.additional_head_versions_lower_bound,0);
  assert.equal(r.sampled_required_runs,3);
  assert.equal(r.invalid_required_run_rows,2);
  assert.equal(r.status,'PARTIAL_INVALID_REQUIRED_RUN_EVIDENCE');
  assert.deepEqual(r.repeated_prs,[]);
});

test('malformed names, mismatched sha, missing provider history, future/old dates fail closed',()=>{
  const h=sha(51);
  const r=assess([
    required(1,3,h,{when:at(1000)}),
    required(2,3,sha(52),{when:at(10000)}),
    {...required(3,3,h),head_sha:sha(999)},
    required(4,3,sha(54),{when:'2026-10-24T00:00:00Z'}),
    required(5,3,sha(55),{when:'2020-01-01T00:00:00Z'}),
    {...required(6,3,sha(56)),id:1},
    {...required(7,3,sha(57)),name:'Required test PR #3 not-a-sha'}
  ]);
  assert.equal(r.status,'PARTIAL_INVALID_REQUIRED_RUN_EVIDENCE');
  assert.equal(r.invalid_required_run_rows,4);
  assert.deepEqual(r.repeated_prs,[]);
  assert.equal(r.automatic_merge_queue_enablement,false);
  assert.equal(observeRequiredHeadChurn({workflowRuns:null,now:NOW}).status,'HOLD_PROVIDER_EVIDENCE_UNVERIFIED');
  assert.equal(observeRequiredHeadChurn({workflowRuns:[],totalCount:-1,now:NOW}).status,'HOLD_PROVIDER_EVIDENCE_UNVERIFIED');
  assert.equal(observeRequiredHeadChurn({workflowRuns:Array(41).fill(null),now:NOW}).status,'HOLD_PROVIDER_EVIDENCE_UNVERIFIED');
});

test('single head-heavy PR alone does not recommend policy changes',()=>{
 const r=assess([required(10,4765,sha(1)),required(11,4765,sha(2)),required(12,4765,sha(3))]);
 assert.equal(r.pr_count_with_repeated_heads,1);
 assert.equal(r.merge_queue_advice,'NO_POLICY_CHANGE_WITHOUT_ADMIN_AND_EXACT_MERGE_GROUP_CHECKS');
});

test('hourly Janitor reuses existing single provider list GET, no extra reads or mutations',async()=>{
 const observations=[
  required(21,4765,sha(2)),required(22,4765,sha(3)),
  required(23,4761,sha(4)),required(24,4761,sha(5)),
  required(25,4761,sha(6))
 ];
 let calls=0;
 const report=await collectObservedCiThroughput({repo:'owner/repo',now:NOW,read:path=>{
  calls++;
  if(path.includes('status=completed'))return {total_count:500,workflow_runs:observations};
  throw Error('simulated job endpoint offline');
 }});
 assert.equal(calls,2,'the existing collector uses one completed-runs GET and stops on first failed job GET');
 assert.equal(report.status,'PARTIAL_PROVIDER_OBSERVATION');
 assert.equal(report.required_head_churn.status,'SAMPLED_REPEATED_CANDIDATE_HEADS_NOT_CAUSAL');
 assert.equal(report.required_head_churn.additional_head_versions_lower_bound,3);
 assert.equal(report.required_head_churn.automatic_merge_queue_enablement,false);
 assert.equal(report.p95_execution_ms,null,'partial jobs must remain unknown even though independent run-list churn was observed');
});

test('main required gates already implement merge_group, all unchanged by telemetry-only PR',()=>{
 const requiredYaml=fs.readFileSync('.github/workflows/required-test.yml','utf8');
 const codeqlYaml=fs.readFileSync('.github/workflows/codeql.yml','utf8');
 const janitorYaml=fs.readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
 assert.match(requiredYaml,/merge_group:/);
 assert.match(codeqlYaml,/merge_group:/);
 assert.match(janitorYaml,/node tools\/delivery\/ci-throughput-telemetry\.mjs/);
 assert.match(janitorYaml,/cron: '17 \* \* \* \*'/);
 assert.equal((janitorYaml.match(/cron: '17 \* \* \* \*'/g)||[]).length,1);
 assert.doesNotMatch(janitorYaml,/ci-required-head-churn.*workflow_dispatch/);
});
