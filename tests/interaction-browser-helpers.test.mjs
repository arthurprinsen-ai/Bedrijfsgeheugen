import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { overlapRatio } = require('../quality/browser/interaction-assertions.js');

test('overlap ratio is zero for separated rectangles', () => {
  assert.equal(overlapRatio({ x: 0, y: 0, width: 100, height: 100 }, { x: 200, y: 200, width: 50, height: 50 }), 0);
});

test('overlap ratio detects material obstruction', () => {
  assert.equal(overlapRatio({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 0, width: 100, height: 100 }), 0.5);
});
