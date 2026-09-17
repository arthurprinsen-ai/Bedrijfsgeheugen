import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('delivery hygiene executes One Loop through the canonical admission module', () => {
  const workflow = read('.github/workflows/powerhouse-delivery-hygiene.yml');
  const module = read('tools/delivery/delivery-hygiene.mjs');
  assert.match(workflow, /delivery-hygiene\.mjs/);
  assert.match(module, /one-loop\.mjs/);
  assert.match(module, /evaluateFinishingPressure/);
});

test('Unified Brain Delivery uses the same hygiene authority before execution and pre-handoff', () => {
  const workflow = read('.github/workflows/unified-brain-delivery.yml');
  assert.match(workflow, /admission:/);
  assert.match(workflow, /pre-handoff-admission:/);
  assert.match(workflow, /powerhouse-delivery-hygiene\.yml/);
  assert.match(workflow, /handoff:/);
});

test('protected Required test routes automation through the lane that executes One Loop contracts', () => {
  const required = read('.github/workflows/required-test.yml');
  const lane = read('.github/workflows/lane-automation.yml');
  assert.match(required, /uses: \.\/\.github\/workflows\/lane-automation\.yml/);
  assert.match(required, /test:/);
  assert.match(lane, /powerhouse-one-loop-\*\.test\.mjs/);
  assert.match(lane, /powerhouse-github-learning\.test\.mjs/);
});
