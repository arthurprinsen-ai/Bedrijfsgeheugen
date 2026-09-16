import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('adversarial matrix registers safe non-destructive cases and fails closed without target', () => {
  const matrix = JSON.parse(fs.readFileSync('config/powerhouse-quality-adversarial-matrix.json','utf8'));
  assert.ok(matrix.cases.length >= 8);
  for (const item of matrix.cases) {
    assert.notEqual(item.safety, 'production_destructive');
    assert.ok(['preview','test','container','registered_runtime'].includes(item.target_class));
    assert.equal(item.missing_target_state, 'NOT_REGISTERED');
  }
});
