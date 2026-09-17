import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseScopeMetadata } from '../tools/delivery-branch-hygiene-guard.mjs';
import { createDeliveryPlan, deriveConflictContracts } from '../tools/brain-delivery-system.mjs';
import { deriveHygieneConflictContracts } from '../tools/delivery/delivery-hygiene.mjs';

const SHA = 'a'.repeat(40);

test('branch hygiene exposes canonical delivery metadata through one parse path', () => {
  const metadata = parseScopeMetadata(`Obligation-ID: powerhouse-delivery-hygiene-v1\nDelivery-Lane: automation\nCandidate-Type: implementation\nBase-SHA: ${SHA}\nSupersedes: none\nChange-Scope: tools/delivery/**\nScope-Budget: 4`);
  assert.equal(metadata.expectedPaths[0], 'tools/delivery/**');
  assert.equal(metadata.maxFiles, 4);
  assert.equal(metadata.delivery.obligationId, 'powerhouse-delivery-hygiene-v1');
  assert.equal(metadata.delivery.deliveryLane, 'automation');
  assert.equal(metadata.delivery.baseSha, SHA);
});

test('delivery hygiene control-plane paths remain executable and conflict-indexed by BRAIN', async () => {
  const policy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));
  const changedPaths = ['tools/delivery/delivery-hygiene.mjs'];
  const contracts = deriveConflictContracts(changedPaths, policy);
  const plan = createDeliveryPlan({ changedPaths, headSha: SHA, policy });
  assert.ok(contracts.includes('delivery-control-plane'));
  assert.ok(plan.lanes.length > 0, 'hygiene control-plane change must select an executable lane');
});

test('all delivery hygiene governance surfaces share the delivery-control-plane conflict contract', async () => {
  const brainPolicy = JSON.parse(await readFile(new URL('../config/brain-delivery-system.json', import.meta.url), 'utf8'));
  const hygienePolicy = JSON.parse(await readFile(new URL('../config/powerhouse-delivery-hygiene-v1.json', import.meta.url), 'utf8'));
  for (const path of [
    'config/powerhouse-delivery-hygiene-v1.json',
    '.github/workflows/powerhouse-delivery-hygiene.yml',
    '.github/workflows/powerhouse-repository-janitor.yml',
    '.github/workflows/required-test.yml',
    '.github/workflows/unified-brain-delivery.yml',
    'tools/delivery/repository-janitor.mjs',
  ]) {
    const contracts = deriveHygieneConflictContracts([path], brainPolicy, hygienePolicy);
    assert.ok(contracts.includes('delivery-control-plane'), `${path} must be delivery-control-plane indexed`);
  }
});
