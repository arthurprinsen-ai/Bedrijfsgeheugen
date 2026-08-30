import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const marker = '- name: BG169 primary Make transport with GitHub-native failover';
const handoff = workflow.split(marker)[1] || '';

test('green executable pull requests can reach BG169 through its current authority contract', () => {
  assert.ok(handoff, 'BG169 production authority step missing');
  const condition = handoff.match(/\n\s*if:\s*([^\n]+)/)?.[1] || '';
  assert.ok(condition.includes("needs.plan.outputs.has_lanes == 'true'"), 'handoff must require executable lanes');
  assert.ok(!condition.includes("startsWith(inputs.candidate_branch, 'writer/')"), 'general Brain production handoff must not be writer-only');
});

test('verification-only writer dispatch remains explicitly non-promoting', () => {
  assert.match(workflow, /Record verification-only non-promotion evidence/);
  assert.match(workflow, /startsWith\(inputs\.candidate_branch, 'writer\/'\).*inputs\.verification_only == true/);
});

test('BG169 carries exact candidate identity across primary and failover transports', () => {
  for (const field of ['PR_NUMBER','BASE_SHA','HEAD_SHA','CANDIDATE_BRANCH']) assert.ok(handoff.includes(`${field}:`), `${field} missing`);
  assert.match(handoff, /expected_head_sha/);
  assert.match(handoff, /head\.repo\.full_name/);
  assert.match(handoff, /BG169 GitHub-native failover/);
  assert.match(handoff, /git merge-base --is-ancestor/);
});
