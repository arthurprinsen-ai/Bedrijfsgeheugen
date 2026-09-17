import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const CANDIDATE_WORKFLOWS = [
  '.github/workflows/required-test.yml',
  '.github/workflows/unified-brain-delivery.yml',
  '.github/workflows/brain-foundation-verify.yml',
  '.github/workflows/shared-agent-memory-tests.yml',
  '.github/workflows/bg168-materiality-promotion-tests.yml',
  '.github/workflows/learning-contract-delivery-classifier-tests.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/powerhouse-codeql.yml',
  '.github/workflows/engineering-intelligence-trust.yml',
  '.github/workflows/engineering-supply-chain-trust.yml',
];

const hasPullRequestTrigger = (workflow) => /(^|\n)\s*pull_request:\s*(\n|$)/.test(workflow);

test('all actual PR fan-out workflows are single-flight per pull request', () => {
  for (const path of CANDIDATE_WORKFLOWS) {
    const workflow = read(path);
    if (!hasPullRequestTrigger(workflow)) continue;
    assert.match(workflow, /concurrency:\s*[\s\S]*?group:\s*[^\n]*github\.event\.pull_request\.number/,
      `${path} must key concurrency on pull request number`);
    assert.match(workflow, /cancel-in-progress:\s*true/,
      `${path} must cancel stale queued or in-progress runs`);
  }
});

test('central delivery workflows do not put candidate head SHA in PR concurrency identity', () => {
  for (const path of [
    '.github/workflows/required-test.yml',
    '.github/workflows/unified-brain-delivery.yml',
  ]) {
    const workflow = read(path);
    const block = workflow.match(/concurrency:\s*\n([\s\S]*?)\n\n/)?.[1] ?? '';
    assert.doesNotMatch(block, /pull_request\.head\.sha|github\.sha|inputs\.head_sha/,
      `${path} must not create a new concurrency group for every candidate SHA`);
  }
});

test('single-flight never replaces exact-head delivery verification', () => {
  const required = read('.github/workflows/required-test.yml');
  const unified = read('.github/workflows/unified-brain-delivery.yml');
  assert.match(required, /PR_HEAD_SHA|candidate_sha|change_head_sha/);
  assert.match(unified, /PR_HEAD_SHA_DRIFT|HEAD_SHA|candidate_identity/);
});
