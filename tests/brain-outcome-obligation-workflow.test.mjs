import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowPath = '.github/workflows/outcome-obligation-sweep.yml';

test('generic obligation sweep supports schedule and manual/event wakeups without direct production mutation', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  for (const required of [
    'schedule:',
    'workflow_dispatch:',
    'actions/checkout@v5',
    'actions/setup-node@v5',
    'node-version: 22',
    'outcome-obligation-runtime.mjs',
    'actions/upload-artifact@v4',
    'permissions:',
    'contents: read',
  ]) assert.ok(yaml.includes(required), `${required} must be present`);
  for (const forbidden of ['psql ', 'supabase db', 'netlify deploy', 'curl -X POST', 'curl --request POST']) {
    assert.equal(yaml.includes(forbidden), false, `${forbidden} must not appear`);
  }
});

test('workflow runs the focused obligation tests before evaluating decisions', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  assert.ok(yaml.includes('node --test tests/brain-outcome-obligation-executor.test.mjs tests/brain-outcome-obligation-runtime.test.mjs'));
  assert.ok(yaml.includes('.artifacts/outcome-obligation-decisions.json'));
});

test('main Supabase migration pushes wake the performance obligation with an exact-SHA fingerprint', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  for (const required of [
    'push:',
    'branches:',
    '- main',
    'paths:',
    "- 'supabase/migrations/**'",
    'github.event_name == \'push\'',
    'supabase-migration:${{ github.sha }}',
    'event-trigger',
    'supabase-performance-evidence-daily',
  ]) assert.ok(yaml.includes(required), `${required} must be present`);
});
