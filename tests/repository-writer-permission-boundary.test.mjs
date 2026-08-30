import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const state = JSON.parse(fs.readFileSync('config/repository-writer-migration.json', 'utf8'));
const lessons = JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json', 'utf8'));
const rules = JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json', 'utf8'));

test('fresh GitHub Actions PR-creation denial invalidates stale approved-central operational proof', () => {
  const writer = state.writers.find((item) => item.name === 'approved-central-blog');
  assert.ok(writer);
  assert.equal(state.prCreationBoundary?.status, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(state.prCreationBoundary?.provider, 'github-actions');
  assert.equal(state.prCreationBoundary?.reason, 'actions_pr_creation_policy_disabled');
  assert.equal(writer.operationalCandidateVerified, false);
  assert.equal(writer.candidateMode, 'blocked_permission');
});

test('known Actions PR-creation policy failure is a proven reusable prevention lesson', () => {
  const lesson = lessons.lessons.find((item) => item.preventionRule === 'BLOCK_WRITER_CANARY_WHEN_ACTIONS_PR_CREATION_DISABLED');
  assert.ok(lesson);
  assert.equal(lesson.status, 'PROVEN');
  assert.match(lesson.reason, /not permitted to create or approve pull requests/i);
  assert.ok(rules.rules.some((rule) => rule.id === 'BLOCK_WRITER_CANARY_WHEN_ACTIONS_PR_CREATION_DISABLED' && rule.active === true));
});
