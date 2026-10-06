import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = await readFile('.github/workflows/required-test.yml','utf8');
const brain = await readFile('.github/workflows/unified-brain-delivery.yml','utf8');
const preview = await readFile('.github/workflows/live-preview-smoke.yml','utf8');
const pricing = await readFile('.github/workflows/prijzen-hero-seo-regression.yml','utf8');
const website = await readFile('.github/workflows/lane-website.yml','utf8');

test('Required test is the canonical PR aggregate gate without a workflow-level queue lock', () => {
  assert.match(required,/pull_request:[\s\S]*branches:\s*\[main\]/);
  assert.match(required,/merge_group:/);
  const header = required.slice(0, required.indexOf('\njobs:'));
  assert.doesNotMatch(header,/^concurrency:/m);
  for (const lane of ['netlify','supabase','backend','portal','automation','website']) {
    assert.match(required,new RegExp(`group: required-${lane}-`));
  }
  assert.match(required,/REQUIRED_STALE_HEAD_YIELD/);
  assert.match(required,/REQUIRED_STALE_HEAD_YIELD_BEFORE_FULL_SUITE/);
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
