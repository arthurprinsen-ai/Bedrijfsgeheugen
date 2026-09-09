import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateContentPerformance, normalizeGrowthEvent } from '../tools/content-growth/aggregate.mjs';

const policy = {
  revenueCurrency: 'EUR',
  weights: { reach: 1, engagement: 2, click: 4, visit: 5, cta: 8, lead: 15, qualified_lead: 30, opportunity: 50, order: 100, revenue: 1 }
};

test('normalizes blog content identity without PII', () => {
  const event = normalizeGrowthEvent({ content_id: 'blog:foo', event_type: 'click', journey_id: 'opaque-123' });
  assert.equal(event.content_type, 'blog');
  assert.equal(event.journey_id, 'opaque-123');
  assert.equal('email' in event, false);
});

test('does not double count the same revenue event/order', () => {
  const result = aggregateContentPerformance([
    { event_id: 'r1', order_id: 'o1', content_id: 'blog:a', event_type: 'revenue', value: 2900, attribution: 'first_touch' },
    { event_id: 'r2', order_id: 'o1', content_id: 'social:b', event_type: 'revenue', value: 2900, attribution: 'last_touch' }
  ], policy);
  assert.equal(result.commercialTotals.revenue, 2900);
});

test('keeps first last assisted attribution evidence separate from canonical totals', () => {
  const result = aggregateContentPerformance([
    { event_id: '1', content_id: 'social:a', event_type: 'click', attribution: 'first_touch' },
    { event_id: '2', content_id: 'blog:b', event_type: 'lead', attribution: 'assisted_touch' },
    { event_id: '3', order_id: 'o7', content_id: 'blog:b', event_type: 'order', attribution: 'last_touch' }
  ], policy);
  assert.equal(result.commercialTotals.orders, 1);
  assert.equal(result.content['social:a'].attribution.first_touch, 1);
  assert.equal(result.content['blog:b'].attribution.assisted_touch, 1);
  assert.equal(result.content['blog:b'].attribution.last_touch, 1);
});

test('an order outranks large low-value engagement', () => {
  const events = [];
  for (let i = 0; i < 20; i++) events.push({ event_id: `e${i}`, content_id: 'social:viral', event_type: 'engagement' });
  events.push({ event_id: 'o', order_id: 'order-1', content_id: 'blog:buyer', event_type: 'order' });
  const result = aggregateContentPerformance(events, policy);
  assert.ok(result.content['blog:buyer'].score > result.content['social:viral'].score);
});
