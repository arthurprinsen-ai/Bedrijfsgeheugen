import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyMainWrite } from '../tools/main-write-integrity.mjs';

test('material single-parent write to main is a governance incident', () => {
  const result = classifyMainWrite({ branch: 'main', parentCount: 1, changedPaths: ['tests/development-doc-contract.test.mjs'], headSha: '1e33e684905bd187e44389d30433dd64cf872f9b' });
  assert.equal(result.status, 'DIRECT_MAIN_WRITE_INCIDENT');
  assert.equal(result.productionGreenAllowed, false);
  assert.equal(result.recoveryRequired, true);
  assert.equal(result.fingerprint, 'delivery|main-write|material-single-parent-bypass-v1');
});

test('github merge commit on main is not classified as a direct-write incident', () => {
  const result = classifyMainWrite({ branch: 'main', parentCount: 2, changedPaths: ['tests/development-doc-contract.test.mjs'], headSha: 'merge-sha' });
  assert.equal(result.status, 'GOVERNED_MERGE');
  assert.equal(result.productionGreenAllowed, true);
});

test('non-main writes do not trigger the main integrity incident', () => {
  const result = classifyMainWrite({ branch: 'brain/candidate', parentCount: 1, changedPaths: ['tools/example.mjs'], headSha: 'candidate-sha' });
  assert.equal(result.status, 'NOT_MAIN');
});

test('post-push workflow observes every push to main and remains read-only', async () => {
  const workflow = await readFile('.github/workflows/main-write-integrity.yml', 'utf8');
  assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[main\]/);
  assert.match(workflow, /tools\/main-write-integrity\.mjs/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /git push|gh pr merge|netlify deploy/i);
});

test('chat learning records direct-main recurrence as stronger prevention knowledge', async () => {
  const lessons = JSON.parse(await readFile('brain/learning/main-write-integrity-lessons-2026-08-31.json', 'utf8'));
  const lesson = lessons.lessons.find(item => item.id === 'DIRECT_MAIN_RECURRENCE_REQUIRES_POST_PUSH_INTEGRITY');
  assert.ok(lesson);
  assert.equal(lesson.fingerprint, 'delivery|main-write|material-single-parent-bypass-v1');
  assert.equal(lesson.preventionRule, 'DIRECT_MAIN_RECURRENCE_REQUIRES_POST_PUSH_INTEGRITY');
  assert.match(lesson.requiredAction, /candidate/i);
  assert.match(lesson.requiredAction, /recovery/i);
});
