import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessQueuePressure,classifyRecovery,criticalWorkflowCoverage,latestCriticalWorkflowRuns} from '../tools/delivery/predictive-controller.mjs';

test('zero-run head becomes recoverable after first-signal SLO',()=>{
  const r=classifyRecovery({workflowRuns:[],headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')});
  assert.equal(r.state,'ZERO_RUN_RECOVERY');
});

test('partial start dispatches only missing critical workflow',()=>{
  const runs=[{name:'Required test',status:'in_progress',updated_at:'2026-09-18T08:01:50Z'}];
  assert.deepEqual(criticalWorkflowCoverage(runs).missing,['unified-brain-delivery.yml']);
  assert.equal(classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')}).state,'PARTIAL_START_RECOVERY');
});

test('stale queued exact-head work is recoverable from run progress timestamps',()=>{
  const runs=[
    {id:11,name:'Required test',status:'queued',updated_at:'2026-09-18T08:00:00Z'},
    {id:12,name:'BRAIN delivery PR #1 abc',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'STALE_QUEUE_RECOVERY');
  assert.deepEqual(r.staleRunIds,[11]);
});

test('healthy current-head in-progress work is never killed merely because the PR head is old',()=>{
  const runs=[
    {id:21,name:'Required test',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'},
    {id:22,name:'BRAIN delivery PR #1 abc',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T06:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});

test('long-running current-head work is observed, not automatically cancelled',()=>{
  const runs=[
    {id:31,name:'Required test',status:'in_progress',updated_at:'2026-09-18T07:30:00Z'},
    {id:32,name:'BRAIN delivery PR #1 abc',status:'completed',conclusion:'success',updated_at:'2026-09-18T07:35:00Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'LONG_RUNNING_OBSERVE');
  assert.match(r.action,/DO_NOT_CANCEL/);
});

test('failed gate is not auto-hidden or bypassed',()=>{
  const runs=[{name:'Required test',status:'completed',conclusion:'failure'},{name:'BRAIN delivery PR #1 abc',status:'completed',conclusion:'success'}];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:00:10Z')});
  assert.equal(r.state,'FAILED_GATE_RECOVERY');
  assert.match(r.action,/READ_FIRST_CURRENT_FAILURE/);
});

test('supervisor reuses Required and BRAIN, cancels only stale queued work and never weakens gates',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/workflow run required-test\.yml/);
  assert.match(yaml,/workflow run unified-brain-delivery\.yml/);
  assert.match(yaml,/STALE_QUEUE_RECOVERY/);
  assert.match(yaml,/staleRunIds/);
  assert.match(yaml,/LONG_RUNNING_OBSERVE/);
  assert.doesNotMatch(yaml,/select\(\.status=="in_progress"/);
  assert.doesNotMatch(yaml,/gh pr merge|merge_pull_request|--admin/);
  assert.doesNotMatch(yaml,/lane-turbo|skip.*gate/i);
});


test('supervisor is bounded and cannot amplify an Actions queue storm',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.doesNotMatch(yaml,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(yaml,/workflow_dispatch:/);
  assert.match(yaml,/schedule:\s*\n\s*- cron: '\*\/5 \* \* \* \*'/);
  assert.match(yaml,/ACTIVE_RUN_CIRCUIT_BREAKER: '12'/);
  assert.match(yaml,/ACTIONS_QUEUE_CIRCUIT_OPEN/);
  assert.match(yaml,/RECOVERY_PR_BUDGET: '1'/);
  assert.match(yaml,/RECOVERY_PR_BUDGET_EXHAUSTED/);
  assert.match(yaml,/active_for_pr/);
  assert.match(yaml,/duplicate dispatch suppressed/);
  assert.match(yaml,/pulls\?state=open|workflow run required-test\.yml|workflow run unified-brain-delivery\.yml/i);
});


test('same-lineage moving-main recovery requires terminal lease and never merges the PR itself',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/contents:\s*write/);
  assert.match(yaml,/MERGE_CONFLICT_RECOVERY/);
  assert.match(yaml,/Writer-Lease-State: TERMINAL_DELIVERY/);
  assert.match(yaml,/Writer-Lease-Owner: powerhouse-terminal-delivery/);
  assert.match(yaml,/head_repo/);
  assert.match(yaml,/repos\/\$repo\/merges/);
  assert.match(yaml,/-f base="\$branch"/);
  assert.match(yaml,/-f head="\$default_branch"/);
  assert.doesNotMatch(yaml,/gh pr merge|merge_pull_request|--admin/);
});


test('newest critical attempt supersedes older cancelled history on the same exact head',()=>{
  const runs=[
    {id:40,name:'Required test',status:'completed',conclusion:'cancelled',updated_at:'2026-09-18T08:00:00Z'},
    {id:41,name:'Required test',status:'in_progress',updated_at:'2026-09-18T08:04:30Z'},
    {id:42,name:'BRAIN delivery PR #2063 abc',status:'completed',conclusion:'cancelled',updated_at:'2026-09-18T08:00:10Z'},
    {id:43,name:'BRAIN delivery PR #2063 abc',status:'in_progress',updated_at:'2026-09-18T08:04:31Z'}
  ];
  const latest=latestCriticalWorkflowRuns(runs);
  assert.equal(latest.required.id,41);
  assert.equal(latest.brain.id,43);
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});

test('non-critical stale queue does not trigger critical delivery redispatch',()=>{
  const runs=[
    {id:51,name:'Required test',status:'completed',conclusion:'success',updated_at:'2026-09-18T08:04:00Z'},
    {id:52,name:'BRAIN delivery PR #2063 abc',status:'completed',conclusion:'success',updated_at:'2026-09-18T08:04:01Z'},
    {id:53,name:'Some expensive optional workflow',status:'queued',updated_at:'2026-09-18T07:00:00Z'}
  ];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T07:00:00Z',now:Date.parse('2026-09-18T08:05:00Z')});
  assert.equal(r.state,'HEALTHY_PROGRESS');
});


test('supervisor resumes recent merged obligations without terminal truth and deduplicates active closure runs',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/Recover merged obligations missing terminal closure/);
  assert.match(yaml,/pulls\?state=closed&base=main/);
  assert.match(yaml,/24 hours ago/);
  assert.match(yaml,/Candidate-Type: \(implementation\|recovery\|security\|dependency\|docs\|promotion\)/);
  assert.match(yaml,/Terminal-State: LIVE_BEWEZEN/);
  assert.match(yaml,/display_title==\$title/);
  assert.match(yaml,/terminal closure already active; duplicate recovery dispatch suppressed/);
  assert.match(yaml,/workflow run obligation-terminal-closure\.yml --ref main -f pr_number=/);
});

test('supervisor force-cancels unresponsive obsolete runs and avoids jq broken-pipe budget exits',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/actions\/runs\/\$run_id\/force-cancel/);
  assert.match(yaml,/--method DELETE "repos\/\$repo\/actions\/runs\/\$run_id"/);
  assert.match(yaml,/done < <\(jq -c '\.\[\]' \/tmp\/open-prs\.json\)/);
  assert.doesNotMatch(yaml,/jq -c '\.\[\]' \/tmp\/open-prs\.json \| while read -r pr/);
});


test('total Actions pressure opens circuit before development queue becomes a storm',()=>{
  const current=assessQueuePressure({queued:11,inProgress:19});
  assert.equal(current.active,30);
  assert.equal(current.state,'CIRCUIT_OPEN');
  assert.equal(current.allowOptionalDispatch,false);
  const projected=assessQueuePressure({queued:4,inProgress:5,projectedNewRuns:4});
  assert.equal(projected.state,'PROJECTED_OVERLOAD');
});
