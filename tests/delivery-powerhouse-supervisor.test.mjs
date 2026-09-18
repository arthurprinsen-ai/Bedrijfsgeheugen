import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyRecovery,criticalWorkflowCoverage} from '../tools/delivery/predictive-controller.mjs';

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
