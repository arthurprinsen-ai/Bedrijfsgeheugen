import test from 'node:test';
import assert from 'node:assert/strict';
import { interactionContracts } from '../quality/interaction-contracts.mjs';
import { validateInteractionContracts } from '../quality/validate-interaction-contracts.mjs';

test('critical homepage interactions are registered', () => {
  const ids = interactionContracts.map(c => c.id);
  assert.ok(ids.includes('homepage-scroll-story'));
  assert.ok(ids.includes('homepage-platform-expertise-toggle'));
});

test('registry fails closed on incomplete contracts', () => {
  const result = validateInteractionContracts([{ id: 'broken', route: '/' }]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.code === 'contract-incomplete'));
});

test('registry rejects duplicate ids and unsupported viewports', () => {
  const duplicate = { id: 'same', route: '/', root: '#x', viewports: ['tablet'], states: ['a'], triggers: ['click'], hooks: { state: 'a', step: 'b', overlay: 'c' } };
  const result = validateInteractionContracts([duplicate, { ...duplicate }]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.code === 'contract-duplicate'));
  assert.ok(result.errors.some(e => e.code === 'contract-invalid-viewport'));
});

test('real interaction registry is valid', () => {
  const result = validateInteractionContracts(interactionContracts);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});
