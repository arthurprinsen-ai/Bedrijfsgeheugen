import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261007100000_commercial_heartbeat_provider_error_closure_v1.sql','utf8');

test('current-set selector retains provider error actions for terminal closure',()=>{
  assert.match(sql,/status in \('suggested','prepared','waiting','done','expired','error'\)/);
  assert.match(sql,/powerhouse_terminalize_current_set_provider_errors_v1/);
  assert.match(sql,/a\.status='error'/);
  assert.match(sql,/decision','OBSERVE'/);
  assert.match(sql,/provider execution failed/);
});

test('provider-error closure runs before terminal lineage and output assurance',()=>{
  const closure=sql.indexOf("v_provider_error_closure := public.powerhouse_terminalize_current_set_provider_errors_v1");
  const terminal=sql.indexOf("v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1");
  const output=sql.indexOf("v_output := public.powerhouse_commercial_output_assurance_v1");
  assert.ok(closure>=0 && closure<terminal && terminal<output);
});

test('provider-error closure preserves single external heartbeat scheduler ownership',()=>{
  assert.doesNotMatch(sql,/cron\.schedule/i);
  assert.match(sql,/'scheduler_authority','NETLIFY_SUPABASE_EDGE'/);
  assert.match(sql,/no fabricated success is allowed/);
  assert.match(sql,/only a fresh deduped quality-ready action may retry/);
});
