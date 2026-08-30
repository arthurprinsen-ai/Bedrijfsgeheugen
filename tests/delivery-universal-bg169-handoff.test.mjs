import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const handoff = workflow.split('- name: Hand exact green lane identities to Brain production authority')[1] || '';

test('green executable pull requests can reach BG169 without writer-only branch gating', () => {
  assert.ok(handoff, 'BG169 production handoff step missing');
  const condition = handoff.match(/\n\s*if:\s*([^\n]+)/)?.[1] || '';
  assert.ok(condition.includes("needs.plan.outputs.has_lanes == 'true'"), 'handoff must require executable lanes');
  assert.ok(!condition.includes("startsWith(inputs.candidate_branch, 'writer/')"), 'general production handoff must not be writer-only');
  assert.ok(!condition.includes("github.event_name == 'workflow_dispatch'"), 'normal pull-request delivery must be eligible for BG169 handoff');
});

test('verification-only writer dispatch remains explicitly non-promoting', () => {
  assert.match(workflow, /Record verification-only non-promotion evidence/);
  assert.match(workflow, /startsWith\(inputs\.candidate_branch, 'writer\/'\).*inputs\.verification_only == true/);
});

test('BG169 payload resolves immutable identity for PR and explicit dispatch events', () => {
  assert.match(handoff, /PR_NUMBER:\s*\$\{\{\s*inputs\.pr_number\s*\|\|\s*github\.event\.pull_request\.number\s*\}\}/);
  assert.match(handoff, /BASE_SHA:\s*\$\{\{\s*needs\.plan\.outputs\.base_sha\s*\}\}/);
  assert.match(handoff, /HEAD_SHA:\s*\$\{\{\s*needs\.plan\.outputs\.head_sha\s*\}\}/);
  assert.match(handoff, /CANDIDATE_BRANCH:\s*\$\{\{\s*inputs\.candidate_branch\s*\|\|\s*github\.event\.pull_request\.head\.ref\s*\}\}/);
});
