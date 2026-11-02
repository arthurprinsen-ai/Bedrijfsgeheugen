import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
// This step has a stable YAML id before its display name. Never slice an
// empty section: readback assertions must inspect the real original source.
const anchor='      - id: janitor_cleanup_readback\n';
const nextAnchor='      - name: Reconcile provider-owned GitHub Actions zero-job ghosts';
assert.equal(source.split(anchor).length-1,1,'exactly one original cleanup readback step');
assert.equal(source.split(nextAnchor).length-1,1,'exactly one original post-readback ghost reconcile');
const start=source.indexOf(anchor);
const end=source.indexOf(nextAnchor,start+anchor.length);
assert.ok(start>=0 && end>start,'original readback must precede the next distinct step');
const step=source.slice(start,end);
assert.match(step,/^      - id: janitor_cleanup_readback\n        name: Read back applied cleanup\n/m);
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
