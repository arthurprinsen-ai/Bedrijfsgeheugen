import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDeliveryPlan } from '../tools/brain-delivery-system.mjs';

const policy = JSON.parse(await readFile('config/brain-delivery-system.json','utf8'));
const headSha = 'a'.repeat(40);
const laneIds = changedPaths => createDeliveryPlan({ changedPaths, headSha, policy }).lanes.map(lane => lane.id);

test('explicit configured workflow lane wins over generic shared workflow fallback', () => {
  assert.deepEqual(laneIds(['.github/workflows/website-cross-browser-screenshot-assurance.yml']), ['website']);
  assert.deepEqual(laneIds(['.github/workflows/portal-visual-density.yml']), ['portal']);
});

test('moving-main recovery control plane no longer activates portal or website lanes', () => {
  assert.deepEqual(laneIds([
    '.github/workflows/powerhouse-delivery-recovery-supervisor.yml',
    '.github/workflows/powerhouse-terminal-writer-lease-closure-guard.yml',
    'tools/delivery/github-delivery-state-machine.mjs',
    'tools/delivery/predictive-controller.mjs',
    'tests/delivery-powerhouse-supervisor.test.mjs',
    'tests/terminal-writer-lease-closure-guard.test.mjs'
  ]), ['automation','backend']);
});

test('delivery latency hardening control plane is bounded to automation and backend', () => {
  assert.deepEqual(laneIds([
    '.github/workflows/powerhouse-delivery-hygiene.yml',
    '.github/workflows/repo-writer-operational-verification.yml',
    'scripts/brain/material-writeback-closure-guard.mjs',
    'tests/delivery-latency-hardening-v1.test.mjs',
    'tests/repository-writer-slow-canary-sla.test.mjs'
  ]), ['automation','backend']);
});

test('Supabase Edge authority is backend scoped instead of all-lane shared', () => {
  assert.deepEqual(laneIds([
    '.github/workflows/supabase-edge-production-authority.yml',
    'brain/contracts/supabase-edge-production-authority-v1.json',
    'tests/brain-runtime-authority-governance.test.mjs'
  ]), ['backend']);
});

test('unknown workflow keeps conservative full-suite fallback', () => {
  assert.deepEqual(laneIds(['.github/workflows/new-unknown-production-control.yml']), ['automation','backend','portal','website']);
});
