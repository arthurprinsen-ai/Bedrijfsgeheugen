import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const marker = '- name: BG169 GitHub-native production transport';
const handoff = workflow.split(marker)[1] || '';

test('green executable components can reach BG169 only through explicit production dispatch', () => {
  assert.ok(handoff, 'BG169 production authority step missing');
  const condition = handoff.match(/\n\s*if:\s*([^\n]+)/)?.[1] || '';
  assert.ok(condition.includes("needs.plan.outputs.has_lanes == 'true'"), 'handoff must require executable lanes');
  assert.ok(condition.includes("github.event_name == 'workflow_dispatch'"), 'ordinary pull_request verification must never invoke BG169');
  assert.ok(condition.includes("inputs.pr_number != ''"), 'BG169 must require an explicit PR number');
  assert.ok(condition.includes('inputs.verification_only != true'), 'verification-only delivery must remain non-promoting');
  assert.ok(!condition.includes("startsWith(inputs.candidate_branch, 'writer/')"), 'general Brain production handoff must remain component-generic');
});

test('live main protection is certified before BG169 production transport', () => {
  const protection = workflow.indexOf('- name: Certify live main protection before production handoff');
  const bg169 = workflow.indexOf(marker);
  assert.ok(protection >= 0 && bg169 > protection, 'live main protection gate must precede BG169');
  assert.match(workflow.slice(protection, bg169), /MAIN_PROTECTION_BLOCKED/);
});

test('verification-only writer dispatch remains explicitly non-promoting', () => {
  assert.match(workflow, /Record verification-only non-promotion evidence/);
  assert.match(workflow, /startsWith\(inputs\.candidate_branch, 'writer\/'\).*inputs\.verification_only == true/);
});

test('BG169 carries exact candidate identity through GitHub-native production transport', () => {
  for (const field of ['PR_NUMBER','BASE_SHA','HEAD_SHA','CANDIDATE_BRANCH']) assert.ok(handoff.includes(`${field}:`), `${field} missing`);
  assert.match(handoff, /head\.repo\.full_name/);
  assert.match(handoff, /-f sha="\$HEAD_SHA"/);
  assert.match(handoff, /BG169_GITHUB_NATIVE_MERGE_REJECTED/);
  assert.match(handoff, /git merge-base --is-ancestor/);
  assert.match(handoff, /transport="github-native"/);
});

test('BG169 production route cannot regress to Make transport', () => {
  assert.doesNotMatch(workflow, /BG169_HANDOFF_URL/);
  assert.doesNotMatch(workflow, /primary Make transport/i);
  assert.doesNotMatch(workflow, /transport="make"/);
  assert.doesNotMatch(workflow, /make_accepted/);
});
