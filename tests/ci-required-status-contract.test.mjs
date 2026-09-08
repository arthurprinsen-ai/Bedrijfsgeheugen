import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const required = await readFile('.github/workflows/required-test.yml','utf8');

test('canonical aggregator keeps exact protected check identity', () => {
  assert.match(required, /\n  test:\n/);
  assert.match(required, /\n    name:\s*test\n/);
});

test('no runner polls Required test merely to mirror test status', async () => {
  await assert.rejects(readFile('.github/workflows/required-test-status-bridge.yml','utf8'), /ENOENT/);
});