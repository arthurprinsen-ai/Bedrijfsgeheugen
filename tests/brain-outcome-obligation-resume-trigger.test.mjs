import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('outcome obligation workflow accepts event-driven resume without changing obligation identity', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /outcome-obligation-resume/);
  assert.match(workflow, /github\.event\.client_payload\.obligation_id/);
  assert.match(workflow, /github\.event\.client_payload\.trigger_fingerprint/);
  assert.match(workflow, /github\.event\.client_payload\.coalesce_key/);
  assert.match(workflow, /--coalesce-key/);
  assert.match(workflow, /event-trigger/);
});

test('workflow_run source identity is stable and path-based', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  assert.match(workflow, /SOURCE_WORKFLOW_PATH:\s*\$\{\{ github\.event\.workflow_run\.path \}\}/);
  assert.match(workflow, /\.github\/workflows\/unified-brain-delivery\.yml/);
  assert.match(workflow, /\.github\/workflows\/production-release-readback\.yml/);
  assert.match(workflow, /canonical_source="Unified Brain Delivery"/);
  assert.match(workflow, /canonical_source="Production Release Readback"/);
  assert.match(workflow, /COMPLETION_SOURCE_WORKFLOW=\$canonical_source/);
});

test('non-applicable workflow_run exits before durable obligation evaluation and backfill', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  const guard = /if \[ "\$\{GITHUB_EVENT_NAME\}" = "workflow_run" \] && \[ "\$\{COMPLETION_EVIDENCE_APPLICABLE:-false\}" != "true" \]; then[\s\S]*?exit 0\s*fi/;

  const evaluateStep = workflow.match(/- name: Evaluate obligations without production mutation[\s\S]*?- name: Reconcile partial decisions/);
  assert.ok(evaluateStep, 'evaluate step must remain present');
  assert.match(evaluateStep[0], guard, 'non-applicable workflow_run must not enter durable obligation runtime');

  const reconcileStep = workflow.match(/- name: Reconcile partial decisions into the same obligation lineage[\s\S]*?- name: Upload immutable decision artifact/);
  assert.ok(reconcileStep, 'reconcile step must remain present');
  assert.match(reconcileStep[0], guard, 'non-applicable workflow_run must not enter durable backfill');

  const uploadStep = workflow.match(/- name: Upload immutable decision artifact[\s\S]*$/);
  assert.ok(uploadStep, 'upload step must remain present');
  assert.match(
    uploadStep[0],
    /if:\s*github\.event_name != 'workflow_run' \|\| env\.COMPLETION_EVIDENCE_APPLICABLE == 'true'/,
    'non-applicable workflow_run must not require decision artifacts',
  );
});

test('applicable workflow_run persistence and runtime use canonical workflow identity', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  assert.match(workflow, /canonical_source="\$\{COMPLETION_SOURCE_WORKFLOW:-\$SOURCE_WORKFLOW\}"/);
  assert.match(workflow, /--workflow "\$canonical_source"/);
  assert.match(workflow, /workflow-run:\$\{canonical_source\}:\$\{SOURCE_RUN_ID\}/);
  assert.match(workflow, /WORKFLOW_NAME="\$\{COMPLETION_SOURCE_WORKFLOW:-\$WORKFLOW_NAME\}"/);
});

test('production readback resolves squash-safe candidate identity from exactly one associated merged PR', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  const productionCase = workflow.match(/\.github\/workflows\/production-release-readback\.yml\)[\s\S]*?;;/);
  assert.ok(productionCase, 'production readback source case must remain present');
  assert.match(productionCase[0], /gh run download[\s\S]*production-release-readback-/);
  assert.match(productionCase[0], /artifact_production_identity="\$\(jq -r '\.merge_sha \/\/ empty'/);
  assert.match(productionCase[0], /test "\$artifact_production_identity" = "\$SOURCE_HEAD_SHA"/);
  assert.match(productionCase[0], /gh api[\s\S]*commits\/\$\{SOURCE_HEAD_SHA\}\/pulls/);
  assert.match(productionCase[0], /merge_commit_sha/);
  assert.match(productionCase[0], /association_count/);
  assert.match(productionCase[0], /COMPLETION_CANDIDATE_ASSOCIATION_AMBIGUOUS/);
  assert.doesNotMatch(productionCase[0], /git rev-parse "\$\{SOURCE_HEAD_SHA\}\^2"/);
  assert.doesNotMatch(productionCase[0], /candidate_sha=.*git show|sed -nE/);
});
