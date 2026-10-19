import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261019133100_fix_runtime_scheduler_reachability.sql', import.meta.url), 'utf8');
const original = Array.from({length:60},(_,m)=>m).filter(m => m % 5 === 1);
const reachable = Array.from({length:60},(_,m)=>m).filter(m => [1,3,4].includes(m % 5));

test('existing canonical job is altered in place; original baseline cadence is unchanged',()=>{
  assert.match(sql,/cron\.alter_job\(v_jobid, schedule =>/);
  assert.doesNotMatch(sql,/cron\.schedule\(/);
  assert.match(sql,/1-59\/5,3-59\/5,4-59\/5 \* \* \* \* /);
  assert.equal(original.length,12);
  assert.equal(reachable.length,36);
  for(const m of original) assert.ok(reachable.includes(m));
  assert.match(sql,/if \(m % 5\) = 1 then[\s\S]*?'execution-resilience-watchdog'[\s\S]*?'reconciliation-worker'[\s\S]*?end if;/);
});

test('every pre-existing mux subtask slot intersects the new cron schedule',()=>{
  const intersect=(predicate)=>reachable.some(predicate);
  assert.ok(intersect(m => m%5===1));
  assert.ok(intersect(m => m%5===3));
  assert.ok(intersect(m => m%5===4));
  assert.ok(intersect(m => m%15===14));
  for(const minutes of [[11,26,41,56],[13,43],[4,19,34,49],[18,48],[23,53],[28,58],[6,21,36,51],[38],[39]]) {
    assert.ok(minutes.some(m=>reachable.includes(m)), 'unreachable task: '+minutes.join(','));
  }
  assert.ok(reachable.includes(4), '06:04Z daily prediction-learning-audit must be reachable');
});

test('existing source dispatch and closed-loop conditions are preserved',()=>{
  assert.match(sql,/if h = 6 and m = 4 then/);
  assert.match(sql,/if \(m % 5\) = 4 then/);
  assert.match(sql,/if \(m % 5\) = 3 then/);
  assert.match(sql,/if \(m % 15\) = 14 then/);
  assert.match(sql,/v_old_schedule NOT IN/);
  assert.match(sql,/refusing overwrite/);
});
