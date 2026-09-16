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
    "github.event_name == 'push'",
    "format('supabase-migration:{0}', github.sha)",
    'event-trigger',
    'supabase-performance-evidence-daily',
  ]) assert.ok(yaml.includes(required), `${required} must be present`);
});

test('delivery readback learning and boundary-clear events wake the same supervisor workflow', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  for (const required of [
    'workflow_run:',
    'Unified Brain Delivery',
    'Production Release Readback',
    'Shared Agent Memory Tests',
    'repository_dispatch:',
    'completion-boundary-clear',
    'completion-material-writeback',
    'github.event.workflow_run.head_sha',
    'github.event.workflow_run.conclusion',
    'completion-supervisor-backfill.mjs',
    '--apply',
    '.artifacts/completion-supervisor-backfill.json',
    'actions: read',
    'completion-supervisor-evidence.mjs',
    '--coalesce-key',
    'material-change-live-verification',
    'bg169-production-evidence',
    'production-release-readback-',
    "jq -r '.candidate_sha // empty'",
  ]) assert.ok(yaml.includes(required), `${required} must be present`);
});

test('workflow executes completion supervisor regressions before durable evaluation', async () => {
  const yaml = await readFile(workflowPath, 'utf8');
  assert.ok(yaml.includes('tests/completion-supervisor.test.mjs'));
  assert.ok(yaml.includes('tests/completion-supervisor-backfill.test.mjs'));
  assert.ok(yaml.indexOf('tests/completion-supervisor.test.mjs') < yaml.indexOf('node tools/outcome-obligation-runtime.mjs'));
});
