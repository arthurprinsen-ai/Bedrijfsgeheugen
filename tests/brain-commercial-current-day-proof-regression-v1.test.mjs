import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const first=readFileSync('supabase/migrations/20261008094500_fix_current_day_commercial_action_proof_v1.sql','utf8');
const second=readFileSync('supabase/migrations/20261008095000_fix_expired_commercial_action_supersede_v1.sql','utf8');
test('current-day eligibility is based on immutable due date rather than heartbeat updated_at',()=>{
 for(const sql of [first,second]){
  assert.match(sql,/a\.due_at at time zone 'Europe\/Amsterdam'/i);
  assert.doesNotMatch(sql,/a\.updated_at at time zone 'Europe\/Amsterdam'/i);
 }
});
test('expired actions are not eligible for current daily commercial proof',()=>{
 for(const sql of [first,second]){
  assert.match(sql,/a\.status in \('suggested','prepared','waiting','done'\)/i);
  assert.doesNotMatch(sql,/a\.status in \('suggested','prepared','waiting','done','expired'\)/i);
 }
});
