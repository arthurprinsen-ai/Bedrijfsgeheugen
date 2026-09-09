import test from 'node:test';
import assert from 'node:assert/strict';
import * as daily from '../tools/content-growth/daily-blog.mjs';
import * as aggregate from '../tools/content-growth/aggregate.mjs';
import * as learning from '../tools/content-growth/learning.mjs';
import * as readback from '../tools/content-growth/live-readback.mjs';

test('content growth modules expose stable interfaces', () => {
  assert.equal(typeof daily.businessDate, 'function');
  assert.equal(typeof daily.resolveDailyPublication, 'function');
  assert.equal(typeof aggregate.aggregateContentPerformance, 'function');
  assert.equal(typeof learning.buildLearningContext, 'function');
  assert.equal(typeof readback.verifyLivePublication, 'function');
});
