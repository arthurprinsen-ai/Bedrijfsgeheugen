import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationPath = new URL('../supabase/migrations/20260916144500_autonomous_improvement_production_cycle_v1.sql', import.meta.url);
const hotfixPath = new URL('../supabase/migrations/20260916151500_fix_autonomous_improvement_record_kind_v1.sql', import.meta.url);
const sql = await readFile(migrationPath, 'utf8');
const hotfix = await readFile(hotfixPath, 'utf8');

test('production cycle reuses canonical Brain authority and existing scheduler', () => {
  assert.match(sql, /powerhouse_autonomous_improvement_cycle_v1/);
  assert.match(sql, /public\.brain_append_record/);
  assert.match(sql, /tenant_id='canonical'|\s*'canonical',/);
  assert.match(sql, /cron\.schedule\('powerhouse-autonomous-improvement-cycle-v1','42 \* \* \* \*'/);
  assert.doesNotMatch(sql, /create\s+table/i);
});

test('production cycle observes real signals and writes the full lifecycle packet', () => {
  for (const source of [
    'brain_failure_occurrences',
    'brain_blocker_occurrences',
    'brain_runtime_metrics',
    'brain_cost_by_operation',
    'brain_value_evaluations',
    'growth_outcomes',
  ]) assert.ok(sql.includes(source), `missing canonical signal source ${source}`);

  for (const stage of [
    'OBSERVE','FITNESS','CAPABILITY_MAP','CANDIDATE','PORTFOLIO','REPLAY','EXPERIMENT','CHAOS',
    'DECIDE','PROMOTE_OR_ROLLBACK','SIMPLIFY','VALUE_ATTRIBUTE','WRITEBACK','REVALIDATE',
  ]) assert.ok(sql.includes(`'${stage}'`), `missing lifecycle stage ${stage}`);
});

test('production cycle is fail-closed and non-destructive', () => {
  assert.match(sql, /causality_not_assumed/);
  assert.match(sql, /causal_claim',false/);
  assert.match(sql, /destructive',false/);
  assert.match(sql, /destructive_auto_delete',false/);
  assert.match(sql, /unknown_critical_evidence_fails_closed/);
  assert.match(sql, /rollback_required/);
  assert.match(sql, /no_magic_score',true/);
});

test('hourly record identity is deterministic and writeback is idempotent', () => {
  assert.match(sql, /date_trunc\('hour', p_now\)/);
  assert.match(sql, /powerhouse-autonomous-improvement-runtime-v1:/);
  assert.match(sql, /'idempotent',true/);
  assert.match(hotfix, /'improvement','current_state'/);
  assert.match(hotfix, /record_kind='current_state'/);
  assert.doesNotMatch(hotfix, /'improvement','autonomous_improvement_cycle'/);
});
