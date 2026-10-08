import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySupabasePreviewCheck } from '../tools/ci/supabase-preview-check-state.mjs';

const check = (id, conclusion, summary = '', status = 'completed', slug = 'supabase') => ({
  name: 'Supabase Preview', app: { slug }, id, status, conclusion, output: { summary },
});

test('only the exact Supabase provider is authoritative', () => {
  assert.equal(classifySupabasePreviewCheck({check_runs: [check(9, 'success', '', 'completed', 'github-actions')]}).state, 'missing');
});

test('select newest exact provider check and retain its unique ID', () => {
  const value = classifySupabasePreviewCheck({ check_runs: [check(5, 'failure'), check(12, 'success')] });
  assert.deepEqual(value, { state: 'success:12', code: 'PREVIEW_PROVIDER_SUCCESS', id: '12' });
});

test('pending provider checks are not treated as success', () => {
  assert.equal(classifySupabasePreviewCheck({ check_runs: [check(12, null, '', 'in_progress')] }).state, 'pending:12');
});

test('skipped due to missing provider branch has a specific actionable class', () => {
  const result = classifySupabasePreviewCheck({check_runs: [check(99, 'skipped', 'This git branch is not associated with any Supabase Branch. You can open a PR to create a new branch.')]});
  assert.equal(result.state, 'skipped:99');
  assert.equal(result.code, 'SUPABASE_PREVIEW_BRANCH_NOT_ASSOCIATED');
});

test('other skipped checks remain non-success without claiming missing association', () => {
  assert.equal(classifySupabasePreviewCheck({check_runs: [check(99, 'skipped', 'Preview disabled by user')]}).code, 'SUPABASE_PREVIEW_SKIPPED');
});

test('replay dependency failures are diagnosed but never marked successful', () => {
  const result = classifySupabasePreviewCheck({check_runs: [check(101, 'failure', 'ERROR: relation "public.powerhouse_identity_graph_v1" does not exist (SQLSTATE 42P01)')]});
  assert.equal(result.code, 'SUPABASE_PREVIEW_MIGRATION_DEPENDENCY');
  assert.equal(result.state, 'failure:101');
});

test('missing provider checks stay missing and cannot approve a merge', () => {
  assert.equal(classifySupabasePreviewCheck({check_runs: []}).state, 'missing');
  assert.equal(classifySupabasePreviewCheck({}).state, 'missing');
});
