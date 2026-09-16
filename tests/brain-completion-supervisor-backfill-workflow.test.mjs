import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('shadow backfill workflow reads existing authorities and cannot dispatch production mutations', async () => {
  const yaml = await readFile('.github/workflows/completion-supervisor-backfill-shadow.yml', 'utf8');
  assert.match(yaml, /workflow_dispatch:/);
  assert.match(yaml, /schedule:/);
  assert.match(yaml, /actions:\s*read/);
  assert.match(yaml, /pull-requests:\s*read/);
  assert.match(yaml, /contents:\s*read/);
  assert.match(yaml, /outcome-obligation-completion-supervisor-backfill\.mjs --collect/);
  assert.match(yaml, /SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{\s*secrets\.SUPABASE_SERVICE_ROLE_KEY\s*\}\}/);
  assert.match(yaml, /upload-artifact/);
  assert.doesNotMatch(yaml, /repository_dispatch/);
  assert.doesNotMatch(yaml, /workflow_dispatches|pulls\/.*merge|deploy/i);
});
