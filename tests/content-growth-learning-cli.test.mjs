import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLearningContext } from '../tools/content-growth/learning.mjs';

test('learning context is JSON serializable for workflow materialization', () => {
  const result = buildLearningContext({ performance: { content: {}, commercialTotals: { orders: 0, revenue: 0, currency: 'EUR' } }, policy: {} });
  assert.doesNotThrow(() => JSON.stringify(result));
});
