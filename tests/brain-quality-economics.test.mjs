import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendLane } from '../scripts/brain/quality/test-economics.mjs';

test('critical security and data tests cannot be demoted for cost', () => {
  for (const dimension of ['security','data_integrity','tenant_isolation']) {
    const result = recommendLane({ dimension, critical: true, runtime_seconds: 10000, defect_yield: 0 });
    assert.equal(result.lane, 'pr_required');
    assert.equal(result.waive_gate, false);
  }
});

test('unknown yield is not treated as zero risk', () => {
  const result = recommendLane({ dimension: 'functional', critical: false, runtime_seconds: 100, defect_yield: null, risk: 'high' });
  assert.notEqual(result.lane, 'drop');
  assert.equal(result.reason.includes('unknown_yield'), true);
});
