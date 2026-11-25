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
  assert.match(yaml,/RECOVERY_PR_BUDGET: '1'/);
});
