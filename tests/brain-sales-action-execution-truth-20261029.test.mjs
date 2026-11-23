import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20261029122836_sales_cycle_execution_truth_guard_20261029.sql','utf8');
test('negative outcomes never cause synthetic execution',()=>{assert.match(sql,/v_action\.status='done' and v_action\.executed_at is not null/i);assert.doesNotMatch(sql,/v_action\.status='done' or v_action\.outcome_id is not null/i);assert.match(sql,/v_ref\|\|':execution'/);});
test('canonical architecture preserved',()=>{assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_advance_sales_action_v1/i);assert.match(sql,/public\.powerhouse_append_cycle_event_v2/i);for(const p of [/create\s+table/i,/cron\.schedule/i,/update\s+public\.powerhouse_cycle_events/i,/delete\s+from\s+public\.powerhouse_cycle_events/i])assert.doesNotMatch(sql,p);});
test('only observed execution advances outcome pending',()=>{const block=/if v_action\.status='done' and v_action\.executed_at is not null then([\s\S]*?)elsif v_action\.status in \('error','expired'\)/i.exec(sql);assert.ok(block);assert.match(block[1],/set status='outcome_pending'/);});
