import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');
const marker = '- name: BG169 primary Make transport with GitHub-native failover';
const handoff = workflow.split(marker)[1] || '';

test('green executable components reach BG169 only through explicit production dispatch', () => {
  assert.ok(handoff, 'BG169 multi-transport production handoff step missing');
  const condition = handoff.match(/\n\s*if:\s*([^\n]+)/)?.[1] || '';
  assert.ok(condition.includes("needs.plan.outputs.has_lanes == 'true'"), 'handoff must require executable lanes');
  assert.ok(condition.includes("github.event_name == 'workflow_dispatch'"), 'BG169 must require explicit workflow_dispatch');
  assert.ok(condition.includes("inputs.pr_number != ''"), 'BG169 must require immutable PR identity');
  assert.ok(condition.includes('inputs.verification_only != true'), 'verification-only dispatch must never promote');
  assert.ok(!condition.includes("startsWith(inputs.candidate_branch, 'writer/')"), 'production handoff remains component-generic, not writer-only');
});

test('verification-only writer dispatch remains explicitly non-promoting', () => {
  assert.match(workflow, /Record verification-only non-promotion evidence/);
  assert.match(workflow, /startsWith\(inputs\.candidate_branch, 'writer\/'\).*inputs\.verification_only == true/);
  assert.match(handoff, /inputs\.verification_only != true/);
});

test('BG169 resolves immutable explicitly dispatched PR identity and rejects acknowledgement-only success', () => {
  assert.match(handoff, /PR_NUMBER:\s*\$\{\{\s*inputs\.pr_number\s*\}\}/);
  assert.match(handoff, /BASE_SHA:\s*\$\{\{\s*needs\.plan\.outputs\.base_sha\s*\}\}/);
  assert.match(handoff, /HEAD_SHA:\s*\$\{\{\s*needs\.plan\.outputs\.head_sha\s*\}\}/);
  assert.match(handoff, /CANDIDATE_BRANCH:\s*\$\{\{\s*inputs\.candidate_branch\s*\}\}/);
  assert.match(handoff, /BG169_HANDOFF_NOT_ACCEPTED/);
});

test('production is green only after exact candidate is verified in main', () => {
  assert.match(handoff, /git merge-base --is-ancestor "\$HEAD_SHA" origin\/main/);
  assert.match(handoff, /BG169_PROMOTION_NOT_VERIFIED/);
  assert.match(handoff, /execution_proof:true,verified:true/);
});
