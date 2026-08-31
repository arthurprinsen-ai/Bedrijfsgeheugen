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

test('github merge commit on main is not classified as direct-main bypass', () => {
  const result = classifyMainWrite({ branch: 'main', parentCount: 2, changedPaths: ['tests/development-doc-contract.test.mjs'], headSha: 'merge-sha' });
  assert.equal(result.status, 'GOVERNED_MERGE');
  assert.equal(result.productionGreenAllowed, true);
});

test('candidate branch write does not trigger main incident', () => {
  const result = classifyMainWrite({ branch: 'brain/candidate', parentCount: 1, changedPaths: ['tools/example.mjs'], headSha: 'candidate-sha' });
  assert.equal(result.status, 'NOT_MAIN');
});

test('main integrity workflow observes every main push and is read-only for repository content', async () => {
  const workflow = await readFile('.github/workflows/main-write-integrity.yml', 'utf8');
  assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[main\]/);
  assert.match(workflow, /tools\/main-write-integrity\.mjs/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /git push|gh pr merge|netlify deploy/i);
});

test('direct-main recurrence remains actionable shared learning', async () => {
  const preflight = await readFile('tools/delivery-preflight.mjs', 'utf8');
  const lessons = await readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8');
  assert.match(lessons, /github\|main-governance\|post-push-ci-after-unauthorized-write/);
  assert.match(preflight, /executionLessonsPath/);
});

test('direct-main incidents create or update one stateful deduplicated recovery issue', async () => {
  const workflow = await readFile('.github/workflows/main-write-integrity.yml', 'utf8');
  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /delivery\|main-write\|material-single-parent-bypass-v1/);
  assert.match(workflow, /DIRECT_MAIN_WRITE_INCIDENT/);
  assert.match(workflow, /gh api/);
  assert.match(workflow, /issues\?state=open/);
  assert.match(workflow, /last_seen_sha/);
  assert.match(workflow, /recoveryRequired/);
  assert.match(workflow, /if:\s*always\(\)/);
});
