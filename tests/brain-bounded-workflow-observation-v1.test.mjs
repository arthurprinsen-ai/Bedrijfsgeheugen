import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planWorkflowObservation } from '../tools/delivery/predictive-controller.mjs';

const policy=JSON.parse(readFileSync(new URL('../brain/policies/powerhouse-agent-continuity-v1.json',import.meta.url),'utf8'));

test('workflow observation is hard-bounded for every agent',()=>{
  const rule=policy.workflow_observation_rule;
  assert.equal(rule.required,true);
  assert.equal(rule.max_top_level_snapshots_per_cycle,1);
  assert.equal(rule.max_failure_drilldowns_per_cycle,1);
  assert.equal(rule.same_snapshot_cooldown_seconds,120);
  assert.equal(rule.max_observation_tool_calls_per_cycle,3);
  assert.equal(rule.max_observation_wall_seconds,30);
  assert.equal(rule.tool_budget_exhausted_behavior,'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK');
  assert.equal(rule.same_head_unchanged_requery_forbidden,true);
  assert.equal(rule.successful_sibling_rechecks,false);
  assert.equal(rule.user_wait_loop_forbidden,true);
});

test('active workflow state releases the agent instead of creating a polling loop',()=>{
  const rule=policy.workflow_observation_rule;
  assert.equal(rule.active_workflow_behavior,'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK');
  assert.equal(rule.terminal_failure_behavior,'DRILL_DOWN_FIRST_FAILED_WORKFLOW_JOB_STEP_THEN_REPAIR');
  assert.equal(rule.completed_success_behavior,'USE_TOP_LEVEL_RESULT_WITHOUT_ENUMERATING_SIBLING_JOBS');
  for(const invariant of [
    'WORKFLOW_OBSERVATION_SINGLE_SNAPSHOT',
    'WORKFLOW_OBSERVATION_ONE_FAILURE_DRILLDOWN',
    'NO_UNCHANGED_WORKFLOW_REPOLL',
    'ACTIVE_WORKFLOW_RELEASES_AGENT'
  ]) assert.ok(policy.invariants.includes(invariant),invariant);
});


test('AGENTS contract hard-bounds workflow observation before remote wait',()=>{
  const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
  assert.match(agents,/github\|workflow-observation\|bounded-single-snapshot\|v1/);
  assert.match(agents,/exact één top-level snapshot/i);
  assert.match(agents,/maximaal één mislukte workflow/i);
  assert.match(agents,/minimaal 120 seconden niet opnieuw/i);
  assert.match(agents,/maximaal 3 status-toolreads en 30 seconden/i);
  assert.match(agents,/nooit openstaan uitsluitend voor polling/i);
});


test('executable workflow observation planner never polls active exact-head CI',()=>{
  const now=Date.parse('2026-10-06T13:50:00Z');
  const active=planWorkflowObservation({
    headSha:'a'.repeat(40),
    workflowRuns:[
      {id:101,name:'Required test',status:'in_progress',conclusion:null,updated_at:'2026-10-06T13:49:55Z'},
      {id:102,name:'Powerhouse CodeQL',status:'queued',conclusion:null,updated_at:'2026-10-06T13:49:56Z'}
    ],
    now
  });
  assert.equal(active.state,'REMOTE_WORKFLOW_ACTIVE');
  assert.equal(active.action,'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK');
  assert.equal(active.shouldPoll,false);
  assert.equal(active.shouldDrillDownFailure,false);
  assert.deepEqual(active.activeRunIds,[101,102]);

  const cooldown=planWorkflowObservation({
    headSha:'a'.repeat(40),
    workflowRuns:[
      {id:101,name:'Required test',status:'in_progress',conclusion:null,updated_at:'2026-10-06T13:49:55Z'},
      {id:102,name:'Powerhouse CodeQL',status:'queued',conclusion:null,updated_at:'2026-10-06T13:49:56Z'}
    ],
    previousObservation:{snapshotKey:active.snapshotKey,observedAt:'2026-10-06T13:50:00Z'},
    now:now+30_000
  });
  assert.equal(cooldown.state,'UNCHANGED_SNAPSHOT_COOLDOWN');
  assert.equal(cooldown.shouldReadTopLevel,false);
  assert.equal(cooldown.shouldPoll,false);
});

test('executable workflow observation planner drills into at most one terminal failure',()=>{
  const failed=planWorkflowObservation({
    headSha:'b'.repeat(40),
    workflowRuns:[
      {id:201,name:'Required test',status:'completed',conclusion:'failure',updated_at:'2026-10-06T13:49:55Z'},
      {id:202,name:'Powerhouse CodeQL',status:'completed',conclusion:'success',updated_at:'2026-10-06T13:49:54Z'}
    ]
  });
  assert.equal(failed.state,'TERMINAL_FAILURE');
  assert.equal(failed.action,'DRILL_DOWN_FIRST_FAILED_WORKFLOW_JOB_STEP_THEN_REPAIR');
  assert.equal(failed.shouldDrillDownFailure,true);
  assert.equal(failed.shouldPoll,false);

  const exhausted=planWorkflowObservation({
    headSha:'b'.repeat(40),
    workflowRuns:[{id:201,name:'Required test',status:'completed',conclusion:'failure'}],
    failureDrilldownsUsed:1
  });
  assert.equal(exhausted.action,'CHECKPOINT_AND_CONTINUE_INDEPENDENT_WORK');
  assert.equal(exhausted.shouldDrillDownFailure,false);
  assert.equal(exhausted.shouldPoll,false);
});

test('executable workflow observation planner stops at hard tool and wall-clock budgets',()=>{
  const byCalls=planWorkflowObservation({observationToolCallsUsed:3});
  assert.equal(byCalls.state,'OBSERVATION_BUDGET_EXHAUSTED');
  assert.equal(byCalls.shouldPoll,false);
  const byTime=planWorkflowObservation({observationWallSeconds:30});
  assert.equal(byTime.state,'OBSERVATION_BUDGET_EXHAUSTED');
  assert.equal(byTime.shouldPoll,false);
});
