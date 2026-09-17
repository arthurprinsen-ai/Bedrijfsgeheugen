import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeliveryMetadataAuthority } from '../tools/delivery/delivery-metadata-authority.mjs';

const SHA_OLD = 'a'.repeat(40);
const SHA_CURRENT = 'b'.repeat(40);
const SHA_RECOVERY = 'c'.repeat(40);

const stalePrBody = `Obligation-ID: powerhouse-one-loop-v1
Delivery-Lane: automation
Candidate-Type: implementation
Base-SHA: ${SHA_OLD}
Supersedes: none
Change-Scope: tools/legacy/**
Scope-Budget: 10`;

const manifest = {
  version: 'POWERHOUSE-DELIVERY-CANDIDATE-v1',
  obligationId: 'powerhouse-one-loop-v1',
  deliveryLane: 'automation',
  candidateType: 'implementation',
  baseSha: SHA_CURRENT,
  supersedes: null,
  expectedPaths: ['tools/delivery/**', 'config/powerhouse-one-loop-v1.json'],
  maxFiles: 60,
};

test('versioned exact-head manifest overrides stale mutable PR delivery metadata for the same implementation obligation', () => {
  const resolved = resolveDeliveryMetadataAuthority({ prBody: stalePrBody, manifest });

  assert.equal(resolved.source, 'versioned-manifest');
  assert.equal(resolved.delivery.obligationId, 'powerhouse-one-loop-v1');
  assert.equal(resolved.delivery.baseSha, SHA_CURRENT);
  assert.deepEqual(resolved.expectedPaths, manifest.expectedPaths);
  assert.equal(resolved.maxFiles, 60);
  assert.equal(resolved.prBodyDrift.baseSha, true);
  assert.equal(resolved.prBodyDrift.expectedPaths, true);
  assert.equal(resolved.prBodyDrift.maxFiles, true);
});

test('validated recovery metadata for the same obligation becomes current authority after the implementation manifest was merged', () => {
  const recoveryPrBody = `Obligation-ID: powerhouse-one-loop-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: ${SHA_RECOVERY}
Supersedes: none
Change-Scope: .github/workflows/outcome-obligation-sweep.yml,tools/delivery/delivery-metadata-authority.mjs
Scope-Budget: 5`;

  const resolved = resolveDeliveryMetadataAuthority({ prBody: recoveryPrBody, manifest });

  assert.equal(resolved.source, 'pr-body-recovery');
  assert.equal(resolved.delivery.obligationId, manifest.obligationId);
  assert.equal(resolved.delivery.deliveryLane, manifest.deliveryLane);
  assert.equal(resolved.delivery.candidateType, 'recovery');
  assert.equal(resolved.delivery.baseSha, SHA_RECOVERY);
  assert.deepEqual(resolved.expectedPaths, [
    '.github/workflows/outcome-obligation-sweep.yml',
    'tools/delivery/delivery-metadata-authority.mjs',
  ]);
  assert.equal(resolved.maxFiles, 5);
});

test('recovery metadata cannot take authority when its lane differs from the versioned obligation lane', () => {
  const invalidRecovery = `Obligation-ID: powerhouse-one-loop-v1
Delivery-Lane: website
Candidate-Type: recovery
Base-SHA: ${SHA_RECOVERY}
Supersedes: none
Change-Scope: website/**
Scope-Budget: 5`;

  assert.throws(
    () => resolveDeliveryMetadataAuthority({ prBody: invalidRecovery, manifest }),
    /DELIVERY_RECOVERY_AUTHORITY_INVALID:DELIVERY_LANE_MISMATCH/,
  );
});

test('versioned manifest never takes authority over a different obligation', () => {
  const otherPrBody = `Obligation-ID: other-obligation
Delivery-Lane: website
Candidate-Type: implementation
Base-SHA: ${SHA_OLD}
Supersedes: none
Change-Scope: website/**
Scope-Budget: 12`;

  const resolved = resolveDeliveryMetadataAuthority({ prBody: otherPrBody, manifest });

  assert.equal(resolved.source, 'pr-body');
  assert.equal(resolved.delivery.obligationId, 'other-obligation');
  assert.equal(resolved.delivery.deliveryLane, 'website');
  assert.equal(resolved.delivery.baseSha, SHA_OLD);
  assert.deepEqual(resolved.expectedPaths, ['website/**']);
  assert.equal(resolved.maxFiles, 12);
});