import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = await readFile('.github/workflows/required-test.yml','utf8');
const brain = await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
const preview = await readFile('.github/workflows/live-preview-smoke.yml','utf8');
const pricing = await readFile('.github/workflows/prijzen-hero-seo-regression.yml','utf8');
const website = await readFile('.github/workflows/lane-website.yml','utf8');

test('Required test is the single-flight PR aggregate gate', () => {
  assert.match(required,/pull_request:[\s\S]*branches:\s*\[main\]/);
  assert.match(required,/merge_group:/);
  assert.match(required,/group:\s*required-test-/);
  assert.match(required,/cancel-in-progress:\s*true/);
  assert.match(required,/Confirm canonical single-flight aggregate gate/);
  assert.match(required,/Aggregate admission and selected lane results/);
});

test('Required test does not poll or wait for duplicate sibling delivery workflows', () => {
  const aggregateBlock = required.slice(required.indexOf('test:\n    name: test'));
  assert.doesNotMatch(aggregateBlock,/require_workflow\s*\(/);
  assert.doesNotMatch(aggregateBlock,/unified-brain-delivery\.yml/);
  assert.doesNotMatch(aggregateBlock,/for attempt in \$\(seq 1 80\)/);
  assert.doesNotMatch(aggregateBlock,/sleep 10/);
  assert.doesNotMatch(aggregateBlock,/actions\/workflows\/.*\/runs\?head_sha=/);
});

test('heavy legacy verification workflows are reusable or manual, not automatic PR fanout', () => {
  assert.doesNotMatch(brain,/^\s*pull_request\s*:/m);
  assert.match(brain,/workflow_dispatch:/);

  assert.doesNotMatch(preview,/^\s*pull_request\s*:/m);
  assert.match(preview,/workflow_call:/);
  assert.match(preview,/workflow_dispatch:/);

  assert.doesNotMatch(pricing,/^\s*pull_request\s*:/m);
  assert.match(pricing,/workflow_call:/);
  assert.match(pricing,/workflow_dispatch:/);
});

test('pricing SEO coverage remains inside the canonical website lane', () => {
  assert.match(website,/tests\/prijzen-hero-seo\.test\.mjs/);
  assert.match(website,/tests\/technical-seo-gate\.test\.mjs/);
});

test('selected lanes remain exact-head and change-scoped', () => {
  for (const lane of ['backend','portal','automation','website']) {
    assert.match(required,new RegExp(`\\n  ${lane}:\\n`));
  }
  assert.match(required,/deriveRequiredTestSuites/);
  assert.match(required,/candidate_sha/);
  assert.match(required,/change_head_sha/);
});
