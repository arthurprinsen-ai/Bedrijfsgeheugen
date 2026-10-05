import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('backend release lane bounds dependency installation and total job duration', async () => {
  const workflow = await readFile('.github/workflows/lane-backend.yml', 'utf8');
  assert.match(workflow, /timeout-minutes:\s*20/);
  assert.match(workflow, /timeout --foreground --signal=TERM --kill-after=30s 8m/);
  assert.match(workflow, /npm install --prefer-offline --no-audit --no-fund/);
  assert.doesNotMatch(workflow, /npm install[^\n]*--silent/);
});
