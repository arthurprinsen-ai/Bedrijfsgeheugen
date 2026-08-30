import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');

test('green executable pull requests can reach BG169 without writer-only branch gating', () => {
  const handoff = workflow.split('- name: Hand exact green lane identities to Brain production authority')[1] || '';
  assert.ok(handoff, 'BG169 production handoff step missing');
  const condition = handoff.match(/\n\s*if:\s*([^\n]+)/)?.[1] || '';
  assert.ok(condition.includes("needs.plan.outputs.has_lanes == 'true'"), 'handoff must require executable lanes');
  assert.ok(!condition.includes("startsWith(inputs.candidate_branch, 'writer/')"), 'general Brain production handoff must not be writer-only');
  assert.ok(!condition.includes("github.event_name == 'workflow_dispatch'"), 'pull-request delivery must be eligible for BG169 handoff');
});

test('verification-only writer dispatch remains explicitly non-promoting', () => {
  assert.match(workflow, /Record verification-only non-promotion evidence/);
  assert.match(workflow, /startsWith\(inputs\.candidate_branch, 'writer\/'\).*inputs\.verification_only == true/);
});

test('BG169 payload resolves PR/base/head/branch for both PR and explicit dispatch events', () => {
  for (const field of ['PR_NUMBER','BASE_SHA','HEAD_SHA','CANDIDATE_BRANCH']) assert.ok(workflow.includes(`${field}:`), `${field} missing`);
  assert.match(workflow, /PR_NUMBER:\s*\$\{\{\s*inputs\.pr_number\s*\|\|\s*github\.event\.pull_request\.number\s*\}\}/);
  assert.match(workflow, /CANDIDATE_BRANCH:\s*\$\{\{\s*inputs\.candidate_branch\s*\|\|\s*github\.event\.pull_request\.head\.ref\s*\}\}/);
});
