import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918132000_action_economics_waiting_execution_v1.sql','utf8');

test('economics execution truth is executed_at, not done status',()=>{
  assert.match(sql,/if v_action\.executed_at is null then/);
  assert.doesNotMatch(sql,/v_action\.status <> 'done'/);
  assert.doesNotMatch(sql,/s\.status<>'done'/);
});

test('economics remains evidence-first',()=>{
  assert.match(sql,/at least one observed economics value is required/);
  assert.match(sql,/economics evidence is required/);
  assert.match(sql,/economics values must be nonnegative/);
});

test('compatibility overload delegates to canonical contract',()=>{
  assert.match(sql,/v_row:=public\.powerhouse_record_action_economics_v1\(/);
  assert.match(sql,/'economics:'\|\|p_action_id::text/);
});

test('economics writer remains service-role only',()=>{
  assert.match(sql,/revoke execute[\s\S]*from public,anon,authenticated/i);
  assert.match(sql,/grant execute[\s\S]*to service_role/i);
});
