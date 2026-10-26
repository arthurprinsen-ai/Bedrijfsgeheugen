import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
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

test('Supabase Required lane checks out the exact PR head before using its local diagnosis script', () => {
  const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');
  const section = workflow.split('\n  supabase_preview:\n')[1]?.split('\n  backend:\n')[0];
  assert.ok(section, 'supabase_preview job must exist');
  const checkout = section.indexOf('uses: actions/checkout@v5');
  const diagnosis = section.indexOf('node tools/ci/supabase-preview-diagnosis.mjs');
  assert.ok(checkout >= 0, 'a fresh Actions runner requires checkout for repository scripts');
  assert.ok(diagnosis > checkout, 'checkout must precede running the diagnosis script');
  assert.match(section, /ref: \$\{\{ needs\.preflight\.outputs\.change_head_sha \}\}/);
  assert.match(section, /persist-credentials: false/);
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


test('archived cron replay failure remains fail-closed and identifies stored migration SQL drift', () => {
  const result = diagnosePreviewCheckRuns({check_runs:[
    check(210, 'failure', 'ERROR: CRON_PRESSURE_CONTRACT_JOB_MISSING:powerhouse-identity-graph-v1 SQLSTATE P0001')
  ]});
  assert.equal(result.code, 'MIGRATION_ARCHIVED_CRON_PRECONDITION');
  assert.equal(result.terminal, true);
  assert.equal(result.conclusion, 'failure');
  assert.match(result.remediation, /archived.*Git SQL/i);
  assert.match(result.remediation, /never rewrite the applied ledger/i);
});

test('provider preview quota exhaustion is NOT a successful preview or permission to remove someone else\'s branch', () => {
  const result = diagnosePreviewCheckRuns({check_runs:[
    check(211, 'skipped', 'This pull request has been ignored due to reaching the limit of concurrent preview branches.')
  ]});
  assert.equal(result.code, 'PREVIEW_CAPACITY_EXHAUSTED');
  assert.equal(result.terminal, true);
  assert.equal(result.conclusion, 'skipped');
  assert.match(result.remediation, /Do not delete another PR owner/);
});

test('actual provider concurrent branch limit cancellation is classified as capacity, not generic CI failure', () => {
  const output = diagnosePreviewCheckRuns({check_runs:[
    check(310, 'cancelled', 'Maximum number of concurrent branches reached. You can update this limit in Project Integrations Settings.')
  ]});
  assert.equal(output.code, 'PREVIEW_CAPACITY_EXHAUSTED');
  assert.equal(output.terminal, true);
  assert.equal(output.conclusion, 'cancelled');
  assert.match(output.remediation, /Project Integrations/);
  assert.match(output.remediation, /Do not delete another PR owner/);
});

test('current provider capacity reason cannot be upgraded to green by an older success', () => {
  const output = diagnosePreviewCheckRuns({check_runs:[
    check(311, 'success', 'previous provider attempt'),
    check(312, 'skipped', 'Maximum number of concurrent preview branches reached')
  ]});
  assert.equal(output.id, '312');
  assert.equal(output.code, 'PREVIEW_CAPACITY_EXHAUSTED');
  assert.equal(output.conclusion, 'skipped');
});

test('newest Supabase-owned check remains the sole preview authority over a stale success', () => {
  const result = diagnosePreviewCheckRuns({check_runs:[
    check(208, 'success', 'Old preview success, no longer current'),
    check(212, 'failure', 'CRON_PRESSURE_CONTRACT_JOB_MISSING:powerhouse-identity-graph-v1')
  ]});
  assert.equal(result.code, 'MIGRATION_ARCHIVED_CRON_PRECONDITION');
  assert.equal(result.id, '212');
});

test('Supabase source provenance is mandatory: a manual branch replay cannot justify a Git-linked cron shim', () => {
  const fs = readFileSync;
  const skill = fs('.agents/skills/powerhouse-delivery-concurrency/SKILL.md','utf8');
  const evidence = JSON.parse(fs('brain/learning/2026-10-19-canonical-runtime-mux-cron-reachability-v1.json','utf8'));
  assert.match(skill,/manual.*branch.*GitHub.*branch/i);
  assert.match(skill,/same.*migration.*version/i);
  assert.equal(evidence.evidence.provider_archived_migration_version, '20261006085416');
  assert.equal(evidence.evidence.provider_archived_statement_md5,'6e4aa572b4c8f5bb4091958db833eba3');
  assert.equal(evidence.evidence.git_linked_preview_archive_md5,'69bebb24ab2651a4fd3f3bf92c5b9790');
  assert.equal(evidence.evidence.git_linked_preview_archive_hard_abort,false);
  assert.equal(evidence.evidence.live_rollout_proven,false);
  assert.equal(existsSync('supabase/migrations/20261006085100_legacy_cron_replay_preconditions.sql'),false);
  assert.equal(existsSync('tests/brain-runtime-scheduler-legacy-replay-preconditions-20261019.test.mjs'),false);
});
