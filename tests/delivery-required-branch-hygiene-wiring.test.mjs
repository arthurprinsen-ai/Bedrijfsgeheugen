import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');
const hygieneWorkflow = readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml', 'utf8');

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

test('delivery hygiene retries transient GitHub API failures and preserves fail-closed evidence', () => {
  assert.match(hygieneWorkflow, /HTTP\\s\+\(\?:502\|503\|504\)/);
  assert.match(hygieneWorkflow, /const delays = \[250, 500, 1000\]/);
  assert.match(hygieneWorkflow, /CONTROL_PLANE_API_UNAVAILABLE/);
  assert.match(hygieneWorkflow, /github-api-transient-unavailable-v1/);
  assert.match(hygieneWorkflow, /writeFailureEvidence/);
  assert.match(hygieneWorkflow, /admitted=false/);
  assert.match(hygieneWorkflow, /if-no-files-found: error/);
});

test('delivery hygiene does not silently ignore conflict-contract API read failures', () => {
  assert.match(hygieneWorkflow, /const files = await gh\(/);
  assert.doesNotMatch(hygieneWorkflow, /try \{\s*const files = (?:await )?gh[\s\S]*?\}\s*catch \{\}/);
});
