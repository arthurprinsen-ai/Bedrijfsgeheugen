import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDeliveryMetadataAuthority } from '../tools/delivery/delivery-metadata-authority.mjs';

const SHA_OLD = 'a'.repeat(40);
const SHA_CURRENT = 'b'.repeat(40);

const stalePrBody = `Obligation-ID: powerhouse-one-loop-v1
Delivery-Lane: automation
Candidate-Type: implementation
Base-SHA: ${SHA_OLD}
Supersedes: none
Change-Scope: tools/legacy/**
Scope-Budget: 10`;

test('versioned exact-head manifest overrides stale mutable PR delivery metadata for the same obligation', () => {
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
