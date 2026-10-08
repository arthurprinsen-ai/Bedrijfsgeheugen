import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { diagnosePreviewCheckRuns } from '../tools/ci/supabase-preview-diagnosis.mjs';

const check = (id, conclusion, summary, status = 'completed') => ({
  id, name: 'Supabase Preview', app: { slug: 'supabase' }, status, conclusion,
  output: { summary }, details_url: 'https://supabase.com/dashboard/project/preview'
});

test('reveals the actual missing Identity Graph dependency from newest provider run', () => {
  const output = diagnosePreviewCheckRuns({ check_runs: [
    check(100, 'skipped', 'This git branch is not associated with any Supabase Branch.'),
    check(101, 'failure', 'ERROR: relation "public.powerhouse_identity_graph_v1" does not exist (SQLSTATE 42P01)'),
  ] });
  assert.equal(output.code, 'MIGRATION_MISSING_RELATION');
  assert.equal(output.id, '101');
  assert.match(output.summary, /powerhouse_identity_graph_v1/);
  assert.match(output.remediation, /dependency-ordered/);
});

test('distinguishes a missing provider branch from a SQL failure; skip is not green', () => {
  const output = diagnosePreviewCheckRuns({ check_runs: [check(102, 'skipped', 'This git branch is not associated with any Supabase Branch.')] });
  assert.equal(output.code, 'PREVIEW_BRANCH_UNASSOCIATED');
  assert.equal(output.terminal, true);
});

test('provider success is the only successful terminal outcome', () => {
  assert.equal(diagnosePreviewCheckRuns({ check_runs: [check(104, 'success', '')] }).code, 'PREVIEW_PROVIDER_SUCCEEDED');
  assert.equal(diagnosePreviewCheckRuns({ check_runs: [check(104, 'neutral', '')] }).code, 'PREVIEW_PROVIDER_NON_SUCCESS');
  assert.equal(diagnosePreviewCheckRuns({ check_runs: [check(104, null, '', 'in_progress')] }).terminal, false);
});

test('does not confuse GitHub-authored lookalike checks with provider-owned proof', () => {
  const fake = { ...check(105, 'success', ''), app: { slug: 'github-actions' } };
  assert.equal(diagnosePreviewCheckRuns({ check_runs: [fake] }).code, 'PREVIEW_PROVIDER_MISSING');
});

test('migration drift and authorization failures produce actionable failure categories', () => {
  assert.equal(diagnosePreviewCheckRuns({check_runs:[check(106,'failure','remote migration versions mismatch with local migration history')]}).code, 'MIGRATION_HISTORY_DRIFT');
  assert.equal(diagnosePreviewCheckRuns({check_runs:[check(107,'failure','permission denied for schema public')]}).code, 'PREVIEW_PROVIDER_AUTHORIZATION');
});

test('Required references exactly one provider diagnosis authority and bounded skipped grace', () => {
  const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');
  assert.match(workflow, /node tools\/ci\/supabase-preview-diagnosis\.mjs \/tmp\/supabase-preview-check-runs\.json/);
  assert.match(workflow, /node --test tests\/brain-supabase-preview-diagnosis-v1\.test\.mjs/);
  assert.match(workflow, /skipped_grace_count.*-le 2/);
  assert.doesNotMatch(workflow, /supabase-preview-check-state\.mjs/);
});

test('CLI emits a machine-readable skipped state and actionable provider reason', () => {
  const dir = mkdtempSync(join(tmpdir(), 'powerhouse-preview-check-'));
  try {
    const file = join(dir, 'checks.json');
    writeFileSync(file, JSON.stringify({check_runs:[
      check(110, 'skipped', 'This git branch is not associated with any Supabase Branch.')
    ]}));
    const output = spawnSync(process.execPath,
      ['tools/ci/supabase-preview-diagnosis.mjs', file],
      { encoding: 'utf8' });
    assert.equal(output.status, 0);
    assert.equal(output.stdout, 'skipped:110');
    assert.match(output.stderr, /PREVIEW_BRANCH_UNASSOCIATED/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
