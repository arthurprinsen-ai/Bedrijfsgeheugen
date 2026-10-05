import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Supabase preview rejects empty migration files', async () => {
  const workflow = await readFile('.github/workflows/supabase-pr-preview.yml', 'utf8');
  assert.ok(workflow.includes("assert not empty"));
  assert.ok(workflow.includes("empty migration files are forbidden"));
  assert.ok(workflow.includes("assert not duplicates"));
  assert.ok(workflow.includes("assert not malformed"));
});
