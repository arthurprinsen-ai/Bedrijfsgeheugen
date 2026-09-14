import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');

test('Required preflight enforces branch hygiene before lane execution', () => {
  assert.match(workflow, /delivery-branch-hygiene-guard\.mjs/);
  assert.match(workflow, /parseScopeMetadata/);
  assert.match(workflow, /evaluateBranchHygiene/);
  assert.match(workflow, /PR_BODY:/);
  assert.match(workflow, /PR_LABELS_JSON:/);
  assert.match(workflow, /if\s*\(!hygiene\.ok\)\s*throw new Error/);
});

test('Required evidence is latest-head-wins so obsolete candidate proof cannot block the current SHA', () => {
  assert.match(workflow, /group:\s*required-test-/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(workflow, /cancel-in-progress:\s*false/);
});
