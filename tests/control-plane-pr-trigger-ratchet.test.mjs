import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluatePrTriggerRatchet } from '../tools/ci/check-pr-trigger-ratchet.mjs';

function makeDir(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-ratchet-'));
  const dir = path.join(root, '.github', 'workflows');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, source] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), source);
  return dir;
}

const pr = 'name: x\non:\n  pull_request:\n    branches: [main]\njobs: {}\n';
const manual = 'name: x\non:\n  workflow_dispatch:\njobs: {}\n';

test('allows removal of existing direct PR triggers', () => {
  const dir = makeDir({ 'required-test.yml': pr, 'old.yml': manual });
  const result = evaluatePrTriggerRatchet({ workflowDir: dir, baselineNames: ['required-test.yml', 'old.yml'] });
  assert.equal(result.status, 'pass');
  assert.deepEqual(result.currentNames, ['required-test.yml']);
});

test('rejects a new workflow name with a direct PR trigger', () => {
  const dir = makeDir({ 'required-test.yml': pr, 'new.yml': pr });
  const result = evaluatePrTriggerRatchet({ workflowDir: dir, baselineNames: ['required-test.yml'] });
  assert.equal(result.status, 'fail');
  assert.deepEqual(result.addedNames, ['new.yml']);
});
