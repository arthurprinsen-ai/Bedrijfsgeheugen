import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadGuardKnowledge, matchPlannedAction } from '../scripts/brain/planned-action-guard.mjs';

// execFileSync defaults to a 1 MiB output buffer. `git ls-files -s` of this repository is
// larger than that, so the required `test` check died with `spawnSync git ENOBUFS`.
const MIB = 1024 * 1024;
const FILES = ['tools/build/artifact-id.mjs', 'tests/delivery-test-coverage-guard.test.mjs'];

function lsFilesCalls(source) {
  return source.split('\n').filter(line => /execFileSync\(\s*'git'\s*,\s*\[\s*'ls-files'/.test(line));
}

for (const file of FILES) {
  test(`${file} sets an explicit maxBuffer on every git ls-files call`, () => {
    const calls = lsFilesCalls(readFileSync(file, 'utf8'));
    assert.ok(calls.length >= 1, 'no git ls-files call found');
    for (const call of calls) {
      const match = call.match(/maxBuffer\s*:\s*([0-9*\s]+)/);
      assert.ok(match, `maxBuffer missing on: ${call.trim()}`);
      const value = match[1].split('*').map(part => Number(part.trim())).reduce((a, b) => a * b, 1);
      assert.ok(value >= 64 * MIB, `maxBuffer too small (${value}) on: ${call.trim()}`);
    }
  });
}

test('the 1 MiB default fails on a larger listing and an explicit maxBuffer succeeds', () => {
  const script = `process.stdout.write('x'.repeat(${2 * MIB}))`;
  assert.throws(() => execFileSync('node', ['-e', script], { encoding: 'utf8' }), error => error.code === 'ENOBUFS');
  const output = execFileSync('node', ['-e', script], { encoding: 'utf8', maxBuffer: 256 * MIB });
  assert.equal(output.length, 2 * MIB);
});

const RULE = 'GIT_LS_FILES_MUST_SET_MAXBUFFER';

test('the planned-action guard blocks lowering the git listing buffer until acknowledged', async () => {
  const knowledge = await loadGuardKnowledge();
  const action = 'Remove the maxBuffer from the git ls-files call in artifact-id';
  const result = matchPlannedAction({ action, ...knowledge });
  assert.ok(result.matches.some(match => match.ruleId === RULE), 'trigger did not fire');
  assert.equal(result.ok, false);
  const passed = matchPlannedAction({ action, ...knowledge, acknowledged: result.unacknowledged.map(match => match.ruleId) });
  assert.equal(passed.ok, true);
});

test('everyday git and build wording does not fire the git listing buffer rule', async () => {
  const knowledge = await loadGuardKnowledge();
  for (const action of [
    'Fix a typo in a blog title',
    'Update the readme with the new build steps',
    'Draft a LinkedIn post about the AI report',
    'Run git status before the commit',
    'Improve the process documentation for onboarding'
  ]) {
    const fired = matchPlannedAction({ action, ...knowledge }).matches.filter(match => match.ruleId === RULE);
    assert.deepEqual(fired, [], `false positive on: ${action}`);
  }
});
