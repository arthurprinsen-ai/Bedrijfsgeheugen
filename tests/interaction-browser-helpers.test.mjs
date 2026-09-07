import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { overlapRatio } = require('../quality/browser/interaction-assertions.js');

test('overlap ratio is zero for separated rectangles', () => {
  const ratio = overlapRatio(
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 200, y: 200, width: 50, height: 50 },
  );
  assert.equal(ratio, 0);
});

test('overlap ratio detects material obstruction', () => {
  const ratio = overlapRatio(
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 50, y: 0, width: 100, height: 100 },
  );
  assert.equal(ratio, 0.5);
});
