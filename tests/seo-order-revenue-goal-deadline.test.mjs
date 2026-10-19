import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20261019075200_fix_revenue_goal_target_end.sql','utf8');
test('revenue target is 1 September 2027',()=>{assert.match(sql,/DATE '2027-09-01' AS target_end/);assert.doesNotMatch(sql,/DATE '2027-09-29' AS target_end/);});
test('pace uses campaign duration',()=>{assert.match(sql,/elapsed_days \/ total_days/);assert.match(sql,/target_end - cfg.target_start/);});
