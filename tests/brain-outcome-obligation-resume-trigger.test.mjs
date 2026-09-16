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

test('non-applicable workflow_run exits before durable obligation evaluation', async () => {
  const workflow = await readFile('.github/workflows/outcome-obligation-sweep.yml', 'utf8');
  const evaluateStep = workflow.match(/- name: Evaluate obligations without production mutation[\s\S]*?- name: Reconcile partial decisions/);
  assert.ok(evaluateStep, 'evaluate step must remain present');
  assert.match(
    evaluateStep[0],
    /if \[ "\$\{GITHUB_EVENT_NAME\}" = "workflow_run" \] && \[ "\$\{COMPLETION_EVIDENCE_APPLICABLE:-false\}" != "true" \]; then[\s\S]*exit 0/,
    'non-applicable workflow_run events must not enter the durable obligation runtime',
  );
});
