import test from 'node:test';
import assert from 'node:assert/strict';

import { certifyDevice } from '../scripts/brain/device-certify.mjs';

const healthy = {
  nodeVersion: '22.23.2',
  gitAvailable: true,
  repoRoot: true,
  deliveryContract: 'BRAIN-DELIVERY-v2',
  brainContract: 'brain.v1',
  onProtectedBranch: false,
  remoteOrigin: 'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen.git',
  prAuthAvailable: true,
  writerWorkflowAvailable: true,
  shadowVerifierAvailable: true,
};

test('clean device is certified only when install, Brain and PR prerequisites are all present', () => {
  const result = certifyDevice(healthy);
  assert.equal(result.ok, true);
  assert.equal(result.state, 'DEVICE_CERTIFIED');
  assert.deepEqual(result.blockers, []);
});

test('certification fails closed when PR authentication is unavailable', () => {
  const result = certifyDevice({ ...healthy, prAuthAvailable: false });
  assert.equal(result.ok, false);
  assert.equal(result.state, 'DEVICE_BLOCKED');
  assert.ok(result.blockers.includes('PR_AUTH_UNAVAILABLE'));
});

test('certification rejects direct autonomous operation on main', () => {
  const result = certifyDevice({ ...healthy, onProtectedBranch: true });
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes('PROTECTED_BRANCH_ACTIVE'));
});

test('certification rejects stale delivery contracts', () => {
  const result = certifyDevice({ ...healthy, deliveryContract: 'BRAIN-DELIVERY-v1' });
  assert.equal(result.ok, false);
  assert.ok(result.blockers.includes('DELIVERY_CONTRACT_MISMATCH'));
});
