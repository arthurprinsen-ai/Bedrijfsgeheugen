import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyRecovery,criticalWorkflowCoverage} from '../tools/delivery/predictive-controller.mjs';

test('zero-run head becomes recoverable after first-signal SLO',()=>{
  const r=classifyRecovery({workflowRuns:[],headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')});
  assert.equal(r.state,'ZERO_RUN_RECOVERY');
});
test('partial start dispatches only missing critical workflow',()=>{
  const runs=[{name:'Required test',status:'in_progress'}];
  assert.deepEqual(criticalWorkflowCoverage(runs).missing,['unified-brain-delivery.yml']);
  assert.equal(classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')}).state,'PARTIAL_START_RECOVERY');
});
test('stale active exact-head runs are recoverable after critical coverage exists',()=>{
  const runs=[{name:'Required test',status:'queued'},{name:'BRAIN delivery PR #1 abc',status:'in_progress'}];
  assert.equal(classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:02:00Z')}).state,'STALE_RUN_RECOVERY');
});
test('failed gate is not auto-hidden or bypassed',()=>{
  const runs=[{name:'Required test',status:'completed',conclusion:'failure'},{name:'BRAIN delivery PR #1 abc',status:'completed',conclusion:'success'}];
  const r=classifyRecovery({workflowRuns:runs,headUpdatedAt:'2026-09-18T08:00:00Z',now:Date.parse('2026-09-18T08:00:10Z')});
  assert.equal(r.state,'FAILED_GATE_RECOVERY');
  assert.match(r.action,/READ_FIRST_CURRENT_FAILURE/);
});
test('supervisor reuses Required and BRAIN and never merges or weakens gates',()=>{
  const yaml=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/workflow run required-test\.yml/);
  assert.match(yaml,/workflow run unified-brain-delivery\.yml/);
  assert.doesNotMatch(yaml,/gh pr merge|merge_pull_request|--admin/);
  assert.doesNotMatch(yaml,/lane-turbo|skip.*gate/i);
});
