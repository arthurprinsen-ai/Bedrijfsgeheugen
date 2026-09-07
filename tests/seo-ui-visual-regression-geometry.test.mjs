import test from 'node:test';
import assert from 'node:assert/strict';
import { intersectionArea, visibleRatio, evaluateGeometry, evaluateHorizontalOverflow } from '../tools/site-shell/ui-visual-regression/geometry.mjs';

test('intersection area is exact and zero when separate', () => {
  assert.equal(intersectionArea({ x: 0, y: 0, width: 100, height: 100 }, { x: 99, y: 0, width: 100, height: 100 }), 100);
  assert.equal(intersectionArea({ x: 0, y: 0, width: 100, height: 100 }, { x: 100, y: 0, width: 100, height: 100 }), 0);
});

test('visible ratio enforces 98 percent threshold', () => {
  assert.equal(visibleRatio({ x: 0, y: 0, width: 100, height: 100 }, { width: 100, height: 98 }), 0.98);
  const fail = evaluateGeometry({ viewport: { width: 100, height: 97 }, required: [{ selector: 'h1', present: true, rect: { x: 0, y: 0, width: 100, height: 100 }, display: 'block', visibility: 'visible', opacity: '1' }], pairs: [], document: { scrollWidth: 100, clientWidth: 100 } }, { visibleRatioMin: 0.98 });
  assert.ok(fail.some(v => v.ruleId === 'visible-ratio'));
});

test('hidden required content fails regardless of rectangle', () => {
  const violations = evaluateGeometry({ viewport: { width: 500, height: 500 }, required: [{ selector: 'h1', present: true, rect: { x: 0, y: 0, width: 100, height: 30 }, display: 'none', visibility: 'visible', opacity: '1' }], pairs: [], document: { scrollWidth: 500, clientWidth: 500 } }, {});
  assert.ok(violations.some(v => v.ruleId === 'hidden-required'));
});

test('overlap allowance defaults to zero', () => {
  const violations = evaluateGeometry({ viewport: { width: 500, height: 500 }, required: [], pairs: [{ aSelector: '.a', bSelector: '.b', aPresent: true, bPresent: true, a: { x: 0, y: 0, width: 100, height: 100 }, b: { x: 99, y: 0, width: 100, height: 100 } }], document: { scrollWidth: 500, clientWidth: 500 } }, { overlapMaxAreaPx2: 0 });
  assert.ok(violations.some(v => v.ruleId === 'overlap'));
});

test('horizontal overflow of one pixel passes and two pixels fails', () => {
  assert.deepEqual(evaluateHorizontalOverflow({ scrollWidth: 101, clientWidth: 100 }, 1), []);
  assert.equal(evaluateHorizontalOverflow({ scrollWidth: 102, clientWidth: 100 }, 1)[0]?.ruleId, 'horizontal-overflow');
});
