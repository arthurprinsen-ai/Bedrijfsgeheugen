import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
const start=source.indexOf('      - name: Read back applied cleanup');
const end=source.indexOf('      - name: Reconcile provider-owned GitHub Actions zero-job ghosts',start);
const step=source.slice(start,end);
test('independently reads current GitHub PR state after all cleanup phases',()=>{
  assert.match(step,/current="\$\(gh api/);
  assert.match(step,/expected=closed/);
  assert.match(step,/state" = "\$expected"/);
});
test('only actual recorded terminal lease reopens change final expected state',()=>{
  assert.match(step,/\.type == "AUTO_REOPEN_TERMINAL_LEASE" and \.pr_number == \$pr/);
  assert.match(step,/expected=open/);
  assert.match(step,/\[ "\$merged" = false \]/);
});
test('unrecorded PR reopen and branch deletion readback stay hard failures',()=>{
  assert.match(step,/JANITOR_READBACK_FAILED/);
  assert.match(step,/JANITOR_BRANCH_DELETE_READBACK_FAILED/);
  assert.match(step,/JANITOR_TERMINAL_LEASE_REOPEN_READBACK_FAILED/);
});
