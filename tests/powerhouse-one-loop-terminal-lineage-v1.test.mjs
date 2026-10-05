import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath='supabase/migrations/20261005140000_powerhouse_one_loop_terminal_lineage_v1.sql';
const sql=await readFile(migrationPath,'utf8');
const workflow=await readFile('.github/workflows/whole-brain-canonical-loop-v2.yml','utf8');
const canon=JSON.parse(await readFile('brain/contracts/powerhouse-operating-canon-v1.json','utf8'));

test('all legacy commercial loop versions are compatibility aliases to the one canonical v1 owner',()=>{
  for(const version of [2,3,4,5,6]){
    assert.match(sql,new RegExp(`create or replace function public\\.powerhouse_commercial_closed_loop_v${version}`,'i'));
  }
  const aliasRefs=(sql.match(/select public\.powerhouse_one_commercial_closed_loop_v1\(p_run_date\)/gi)||[]).length;
  assert.equal(aliasRefs,5);
  assert.match(sql,/non_alias_legacy_loop_count/i);
});

test('terminal action lineage is automatic and does not fabricate observed business outcomes',()=>{
  assert.match(sql,/create trigger trg_powerhouse_sales_action_terminal_lineage_v1/i);
  assert.match(sql,/business_outcome_state/i);
  assert.match(sql,/outcome_obligation/i);
  assert.match(sql,/observed_business_outcome/i);
  assert.match(sql,/Lifecycle closure is not an observed business outcome/i);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.powerhouse_sales_outcomes/i);
  assert.match(sql,/for update skip locked/i);
  assert.match(sql,/powerhouse_backfill_terminal_lineage_v1/i);
});

test('exactly one full commercial scheduler owner is canonicalised and split-stage legacy owners are disabled',()=>{
  assert.match(sql,/powerhouse-one-commercial-loop-daily-v1/i);
  assert.match(sql,/powerhouse_one_commercial_decision_loop_v1/i);
  assert.match(sql,/powerhouse-commercial-context-daily-v1/i);
  assert.match(sql,/powerhouse-commercial-actions-daily-v1/i);
  assert.match(sql,/cron\.unschedule/i);
  assert.doesNotMatch(sql,/update\s+cron\.job/i);
});

test('runtime regression gate proves scheduler alias and terminal lineage invariants',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_one_loop_regression_gate_v1/i);
  assert.match(sql,/canonical_scheduler_owner_count/i);
  assert.match(sql,/active_split_stage_scheduler_count/i);
  assert.match(sql,/unaccounted_terminal_action_count/i);
  assert.match(sql,/open_observed_outcome_obligations/i);
  assert.match(sql,/bg_gezondheid/i);
});

test('whole-brain workflow permanently runs the one-loop canonicalisation regression',()=>{
  assert.match(workflow,/powerhouse-one-loop-terminal-lineage-v1\.test\.mjs/i);
});

test('operating canon declares one runtime loop and shared wiring surfaces',()=>{
  assert.equal(canon.one_loop_runtime?.contract,'powerhouse-one-loop-terminal-lineage-v1');
  assert.equal(canon.one_loop_runtime?.full_loop_scheduler_owner,'powerhouse-one-commercial-loop-daily-v1');
  for(const surface of ['heartbeat','powerhouse_brain','intelligence_layers','agents','chat','portal']){
    assert.ok(canon.one_loop_runtime?.wired_surfaces?.includes(surface),`missing wired surface: ${surface}`);
  }
});
