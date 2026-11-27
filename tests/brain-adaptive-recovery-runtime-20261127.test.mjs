import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recoveryBudget} from '../tools/delivery/adaptive-recovery-capacity.mjs';
test('runtime calls canonical capacity and checks reserved pressure before next recovery',()=>{
 const y=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.ok(y.includes('cycle_budget="$(recovery_budget "$initial_active_runs")"'));
 assert.ok(y.includes('reserved_pressure=$((initial_active_runs + 3 * recovered_prs))'));
 assert.ok(y.includes('remaining="$(recovery_budget "$reserved_pressure")"'));
 assert.ok(y.includes('[ "$candidate_budget" -ge "$cycle_budget" ] || cycle_budget="$candidate_budget"'));
 assert.ok(y.includes('[ "$recovered_prs" -ge "$cycle_budget" ]'));
 assert.ok(y.includes("ACTIVE_RUN_CIRCUIT_BREAKER: '12'"));
});
test('conservative reserve survives delayed provider visibility and rising pressure',()=>{
 for(let initial=0;initial<=15;initial++)for(let used=0;used<=recoveryBudget({activeRuns:initial});used++)for(let observed=0;observed<=15;observed++){
  const pressure=Math.max(observed,initial+3*used);
  const remaining=Math.min(recoveryBudget({activeRuns:initial})-used,recoveryBudget({activeRuns:pressure}));
  assert.ok(remaining>=0);
  if(remaining>0)assert.ok(pressure+3*remaining<=10);
 }
});
