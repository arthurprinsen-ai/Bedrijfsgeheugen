import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('CI Intelligence emits bounded calibration in the canonical report', async () => {
  const source = await readFile('scripts/brain/powerhouse-ci-intelligence.mjs','utf8');
  assert.match(source,/calibrateCi/);
  assert.match(source,/powerhouse-ci-calibration-v1\.json/);
  assert.match(source,/const report = \{ \.\.\.baseReport, calibration \}/);
  assert.match(source,/Calibration recommendations/);
});

test('calibration workflow remains measurement-only with read permissions', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-ci-intelligence.yml','utf8');
  assert.match(workflow,/actions: read/);
  assert.match(workflow,/contents: read/);
  assert.doesNotMatch(workflow,/contents: write/);
  assert.doesNotMatch(workflow,/pull-requests: write/);
});

test('calibration policy forbids direct mutation and gate weakening', async () => {
  const policy = JSON.parse(await readFile('config/powerhouse-ci-calibration-v1.json','utf8'));
  assert.equal(policy.mode,'SHADOW_RECOMMENDATIONS');
  assert.equal(policy.guardrails.neverLowerSecurityCoverage,true);
  assert.equal(policy.guardrails.neverBypassRequired,true);
  assert.equal(policy.guardrails.neverBypassCodeQL,true);
  assert.equal(policy.guardrails.neverBypassProductionReadback,true);
  assert.equal(policy.guardrails.neverAutoMergeCalibration,true);
});
