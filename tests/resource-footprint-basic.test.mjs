import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTokenFootprint } from '../platform/cost/ai-token-usage.mjs';

test('token footprint is unknown without a matching factor', () => {
  const result = deriveTokenFootprint({ requestId: 'R1', provider: 'ProviderA', providerModelId: 'ModelA', totalTokens: 500, at: '2026-09-15T12:00:00Z' }, []);
  assert.equal(result.status, 'unknown_factor');
  assert.equal(result.energyKwh, null);
});
