// Canonical learning evaluation entrypoint, using the real existing supervisor suite.
import './delivery-recovery-pr-prioritizer.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('canonical Recovery Supervisor remains the only protected writer and CAS owner',()=>{
  const yaml=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
  assert.match(yaml,/node tools\/delivery\/recovery-pr-prioritizer\.mjs/);
  assert.match(yaml,/RECOVERY_PRIORITY_EVIDENCE_UNAVAILABLE/);
  assert.match(yaml,/expected_head_sha/);
  assert.match(yaml,/cancel-in-progress: false/);
  assert.match(yaml,/RECOVERY_PR_BUDGET:\s*'5'/); assert.ok(yaml.includes('cycle_budget="$(recovery_budget "$initial_active_runs")"')); assert.ok(yaml.includes('reserved_pressure=$((initial_active_runs + 3 * recovered_prs))')); assert.ok(yaml.includes('remaining="$(recovery_budget "$reserved_pressure")"')); assert.ok(yaml.includes('[ "$recovered_prs" -ge "$cycle_budget" ]'));
});
