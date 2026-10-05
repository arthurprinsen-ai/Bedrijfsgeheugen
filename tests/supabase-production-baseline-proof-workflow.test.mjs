import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/supabase-production-baseline-proof.yml', import.meta.url), 'utf8');

test('production baseline proof is trusted-main-only and read-only', () => {
  assert.match(workflow, /refs\/heads\/main/);
  assert.match(workflow, /permissions:\n  contents: read\n  pull-requests: read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
});

test('production schema authority is official Supabase CLI rather than pg_catalog synthesis', () => {
  assert.match(workflow, /supabase db dump --linked --file \.\.\/evidence\/production-schema\.sql/);
  assert.match(workflow, /supabase migration list --linked/);
  assert.doesNotMatch(workflow, /pg_catalog/i);
  assert.doesNotMatch(workflow, /information_schema/i);
});

test('candidate replay is fresh, local and secret-free', () => {
  const replay = workflow.split('- name: Fresh replay candidate from repository state')[1]?.split('- name: Prove official baseline parity')[0] || '';
  assert.match(replay, /supabase db reset --local/);
  assert.match(replay, /supabase db dump --local/);
  assert.doesNotMatch(replay, /secrets\./);
  assert.doesNotMatch(replay, /SUPABASE_DB_PASSWORD/);
  assert.doesNotMatch(replay, /SUPABASE_ACCESS_TOKEN/);
});

test('Supabase CLI is version-pinned and proof remains explicitly pre-terminal', () => {
  assert.match(workflow, /version: 2\.119\.0/);
  assert.match(workflow, /terminal_for_issue_3742: false/);
  assert.match(workflow, /post-merge production readback/);
});
