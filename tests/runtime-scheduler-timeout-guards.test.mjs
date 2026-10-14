import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20261014183000_runtime_scheduler_timeout_guards.sql','utf8');

test('runtime task wrapper restores prior timeout on success and failure, never disables it',()=>{
  assert.match(sql,/v_prior_timeout text:=current_setting\('statement_timeout'\)/);
  assert.equal((sql.match(/set_config\('statement_timeout',v_prior_timeout,true\)/g)||[]).length,3);
  assert.doesNotMatch(sql,/set_config\('statement_timeout','0',true\)/);
});

test('outer timeout starts before cron scheduler DO and preserves job frequency',()=>{
  assert.match(sql,/SET statement_timeout = ''30s'';/);
  assert.match(sql,/cron\.alter_job\(/);
  assert.match(sql,/Scheduler 171 command differs from reviewed source; fail closed/);
  assert.doesNotMatch(sql,/cron\.unschedule/);
});

test('privileged dynamic SQL helper not available to public web roles',()=>{
  assert.match(sql,/revoke all on function public\.powerhouse_runtime_mux_task_v1\(text,text,integer\)/);
  assert.match(sql,/from public, anon, authenticated/);
});
