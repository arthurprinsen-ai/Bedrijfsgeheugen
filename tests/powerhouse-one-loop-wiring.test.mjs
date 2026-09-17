import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('delivery hygiene runs One Loop validation before expensive execution', () => {
  const workflow = read('.github/workflows/powerhouse-delivery-hygiene.yml');
  assert.match(workflow, /powerhouse-one-loop-v1|one-loop\.mjs/i);
});

test('Unified Brain Delivery rechecks One Loop before handoff or promotion', () => {
  const workflow = read('.github/workflows/unified-brain-delivery.yml');
  assert.match(workflow, /one-loop\.mjs|POWERHOUSE-ONE-LOOP-v1/i);
  assert.match(workflow, /handoff|promotion|promot/i);
});

test('protected Required test executes One Loop contract tests while keeping test aggregator authority', () => {
  const workflow = read('.github/workflows/required-test.yml');
  assert.match(workflow, /powerhouse-one-loop-contract\.test\.mjs/);
  assert.match(workflow, /powerhouse-github-learning\.test\.mjs/);
  assert.match(workflow, /test:/);
});
