import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const wf=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');

test('one existing supervisor provides structured provider-only recovery telemetry',()=>{
  for(const key of ['drift_or_conflict_seen','drift_without_terminal_lease','repeated_drift_seen','drift_budget_exhausted','cas_update_attempts','cas_update_failed','main_sync_pending_seen','main_sync_proven','main_sync_async_pending','failed_gate_unleased','sweep_elapsed_seconds']){
    assert.ok(wf.includes(key),key);
  }
  assert.match(wf,/RECOVERY_SUPERVISOR_OBSERVATION_V1:/);
  assert.match(wf,/GITHUB_STEP_SUMMARY/);
  assert.match(wf,/causal_speedup_proven:false,customer_value_proven:false/);
  assert.equal((wf.match(/name: Powerhouse Delivery Recovery Supervisor/g)||[]).length,1);
  assert.equal((wf.match(/cron: '\*\/5 \* \* \* \*'/g)||[]).length,1);
  assert.match(wf,/MAX_MAIN_DRIFT_REFRESHES: '2'/);
  assert.match(wf,/RECOVERY_PR_BUDGET: '1'/);
  assert.match(wf,/cancel-in-progress: false/);
  assert.ok(wf.includes('expected_head_sha="$head"'));
  assert.ok(!wf.includes('gh api --method POST "repos/$repo/merges"'));
});
test('main sync remains fail closed and the recovery shell parses',()=>{
  assert.ok(wf.includes('MAIN_DRIFT_SYNC_UNVERIFIED'));
  assert.ok(wf.includes('MAIN_DRIFT_UPDATE_UNVERIFIED'));
  assert.ok(wf.includes('MAIN_DRIFT_REFRESH_BUDGET_EXHAUSTED'));
  const step=wf.split('      - name: Recover exact-head canonical Required gate\n')[1]?.split('      - name: Recover merged obligations missing terminal closure\n')[0];
  assert.ok(step);
  const raw=step.substring(step.indexOf('          set -euo pipefail'));
  const sh=raw.split('\n').map(line=>line.startsWith('          ')?line.substring(10):line).join('\n');
  const syntax=spawnSync('bash',['-n'],{input:sh,encoding:'utf8'});
  assert.equal(syntax.status,0,syntax.stderr);
});
