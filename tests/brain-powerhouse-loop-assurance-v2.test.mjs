import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateLoopRegistry, REQUIRED_STAGES } from '../scripts/brain/powerhouse-loop-assurance-contract.mjs';

const complete = (overrides = {}) => ({
  loop_key: 'example-loop',
  runtime_source: 'example-runtime',
  cron_jobname: 'example-cron',
  expected_cadence_minutes: 60,
  critical: true,
  required_stages: [...REQUIRED_STAGES],
  ...overrides,
});

test('canonical loop registry is structurally valid', () => {
  const registry = JSON.parse(fs.readFileSync('powerhouse/assurance/loop-registry.json', 'utf8'));
  const result = validateLoopRegistry(registry);
  assert.equal(result.ok, true, result.gaps.join('\n'));
  assert.ok(result.count >= 10);
});

test('loop cannot be green-contract eligible without runtime or scheduler authority', () => {
  const result = validateLoopRegistry({ fingerprint:'powerhouse-loop-assurance-v2', loops:[complete({runtime_source:null,cron_jobname:null})] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some(g => g.includes('runtime_source')));
});

test('all eight closure stages are mandatory', () => {
  const result = validateLoopRegistry({ fingerprint:'powerhouse-loop-assurance-v2', loops:[complete({required_stages:REQUIRED_STAGES.slice(0,-1)})] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some(g => g.includes('guard')));
});

test('duplicate loop keys fail closed', () => {
  const loop = complete();
  const result = validateLoopRegistry({ fingerprint:'powerhouse-loop-assurance-v2', loops:[loop,{...loop}] });
  assert.equal(result.ok, false);
  assert.ok(result.gaps.some(g => g.includes('duplicate')));
});
