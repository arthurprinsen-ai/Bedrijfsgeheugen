import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectTestsForChangedPaths, partitionFailures, IGNORED_PREFIXES, MAX_TESTS } from '../scripts/ci/select-tests-for-changed-paths.mjs';

const tests = [
  { file: 'tests/a.test.mjs', text: "read('../blog/wat-kost-een-afas-koppeling/index.html')" },
  { file: 'tests/b.test.mjs', text: "read('../blog/anders/index.html')" },
  { file: 'tests/c.test.mjs', text: 'AGENTS.md' },
];

test('a changed page selects exactly the tests that read it', () => {
  const r = selectTestsForChangedPaths({ changedPaths: ['blog/wat-kost-een-afas-koppeling/index.html'], tests });
  assert.deepEqual(r.selected, ['tests/a.test.mjs']);
});

test('changed test files always run, and ignored governance paths select nothing', () => {
  const r = selectTestsForChangedPaths({ changedPaths: ['tests/b.test.mjs', 'AGENTS.md', '.agents/skills/x/SKILL.md', 'docs/changes/x.md'], tests });
  assert.deepEqual(r.selected, ['tests/b.test.mjs']);
  assert.ok(IGNORED_PREFIXES.includes('AGENTS.md'));
});

test('overflow is reported instead of silently dropped', () => {
  const many = Array.from({ length: MAX_TESTS + 3 }, (_, i) => ({ file: `tests/m${String(i).padStart(3, '0')}.test.mjs`, text: 'shared/file.js' }));
  const r = selectTestsForChangedPaths({ changedPaths: ['shared/file.js'], tests: many });
  assert.equal(r.selected.length, MAX_TESTS);
  assert.equal(r.overflow.length, 3);
});

test('required PR check runs the selector on the exact scope shas', async () => {
  const wf = await readFile(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  const at = wf.indexOf('Run tests that read changed files before merge');
  assert.ok(at > -1);
  const step = wf.slice(at, at + 500);
  assert.ok(step.includes('scripts/ci/select-tests-for-changed-paths.mjs'));
  assert.ok(step.includes('steps.scope.outputs.base_sha') && step.includes('steps.scope.outputs.change_head_sha'));
});

test('failures already red on the base are reported but only new failures block', () => {
  const r = partitionFailures({ failed: ['tests/a.test.mjs', 'tests/b.test.mjs'], redOnBase: ['tests/a.test.mjs'] });
  assert.deepEqual(r.blocking, ['tests/b.test.mjs']);
  assert.deepEqual(r.knownRedOnBase, ['tests/a.test.mjs']);
  assert.deepEqual(partitionFailures({ failed: ['tests/a.test.mjs'] }).blocking, ['tests/a.test.mjs']);
});
