import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');
const hygieneWorkflow = readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml', 'utf8');
const mergedBranchCleanup = readFileSync('.github/workflows/powerhouse-merged-branch-cleanup.yml', 'utf8');
const engineeringIntelligence = readFileSync('.github/workflows/engineering-intelligence-trust.yml', 'utf8');
const supplyChain = readFileSync('.github/workflows/engineering-supply-chain-trust.yml', 'utf8');
const learningClassifier = readFileSync('.github/workflows/learning-contract-delivery-classifier-tests.yml', 'utf8');

test('Required preflight enforces exact-head versioned branch hygiene before lane execution', () => {
  assert.match(workflow, /delivery-branch-hygiene-guard\.mjs/);
  assert.match(workflow, /delivery-metadata-authority\.mjs/);
  assert.match(workflow, /resolveDeliveryMetadataAuthority/);
  assert.match(workflow, /powerhouse-one-loop-v1\.json/);
  assert.match(workflow, /github\.event\.pull_request\.head\.sha \|\| github\.sha/);
  assert.match(workflow, /evaluateBranchHygiene/);
  assert.match(workflow, /PR_BODY:/);
  assert.match(workflow, /PR_LABELS_JSON:/);
  assert.match(workflow, /VERSIONED_BASE_SHA_MISMATCH/);
  assert.match(workflow, /if\s*\(!hygiene\.ok\)\s*throw new Error/);
});

test('Required evidence is latest-head-wins so obsolete candidate proof cannot block the current SHA', () => {
  assert.match(workflow, /group:\s*required-test-/);
  assert.match(workflow, /github\.event\.pull_request\.head\.sha/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
  assert.doesNotMatch(workflow, /cancel-in-progress:\s*false/);
});

test('non-required PR runner fanout stays path-scoped and latest-head-wins', () => {
  for (const [name, yml] of [
    ['engineering intelligence', engineeringIntelligence],
    ['supply chain', supplyChain],
    ['learning classifier', learningClassifier],
  ]) {
    assert.match(yml, /pull_request:[\s\S]*?paths:/, `${name} must be path-scoped for pull requests`);
    assert.match(yml, /concurrency:[\s\S]*?cancel-in-progress:\s*true/, `${name} must cancel stale runs`);
  }
  assert.match(supplyChain, /dependency-review:[\s\S]*?if:\s*github\.event_name == 'pull_request'/);
  assert.match(supplyChain, /provenance:[\s\S]*?if:\s*github\.event_name == 'push'/);
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

test('merged same-repository branches are deleted only after exact-head verification and readback', () => {
  assert.match(mergedBranchCleanup, /types:\s*\[closed\]/);
  assert.match(mergedBranchCleanup, /github\.event\.pull_request\.merged == true/);
  assert.match(mergedBranchCleanup, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(mergedBranchCleanup, /head\.ref != github\.event\.repository\.default_branch/);
  assert.match(mergedBranchCleanup, /contents:\s*write/);
  assert.match(mergedBranchCleanup, /EXPECTED_HEAD_SHA/);
  assert.match(mergedBranchCleanup, /HEAD_DRIFT/);
  assert.match(mergedBranchCleanup, /git\/refs\/heads\/\$\{HEAD_REF\}/);
  assert.match(mergedBranchCleanup, /gh api -X DELETE/);
  assert.match(mergedBranchCleanup, /DELETE_READBACK_FAILED/);
  assert.match(mergedBranchCleanup, /HTTP 404/);
  assert.match(mergedBranchCleanup, /EXACT_MERGED_HEAD_REMOVED/);
  assert.match(mergedBranchCleanup, /Upload merged branch cleanup evidence/);
});
