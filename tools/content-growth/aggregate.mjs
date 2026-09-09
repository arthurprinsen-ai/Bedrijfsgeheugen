const COMMERCIAL_TYPES = new Set(['order', 'revenue']);

function safeNumber(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeGrowthEvent(event) {
  if (!event || typeof event !== 'object') throw new Error('growth event must be an object');
  if (!event.content_id) throw new Error('content_id is required');
  if (!event.event_type) throw new Error('event_type is required');
  return {
    event_id: String(event.event_id || `${event.content_id}:${event.event_type}:${event.occurred_at || ''}`),
    occurred_at: event.occurred_at || null,
    content_id: String(event.content_id),
    content_type: event.content_type || (String(event.content_id).startsWith('blog:') ? 'blog' : 'social'),
    channel: event.channel || 'unknown',
    source: event.source || null,
    medium: event.medium || null,
    campaign: event.campaign || null,
    event_type: String(event.event_type),
    value: safeNumber(event.value),
    currency: event.currency || 'EUR',
    journey_id: event.journey_id || null,
    order_id: event.order_id || null,
    attribution: event.attribution || null,
    metadata: event.metadata && typeof event.metadata === 'object' ? event.metadata : {}
  };
}

export function aggregateContentPerformance(events = [], policy = {}) {
  const weights = policy.weights || {};
  const content = {};
  const uniqueCommercial = new Map();

  for (const raw of events) {
    const event = normalizeGrowthEvent(raw);
    const bucket = content[event.content_id] ||= {
      content_id: event.content_id,
      content_type: event.content_type,
      channels: {},
      events: {},
      score: 0,
      revenue: 0,
      orders: 0,
      attribution: { first_touch: 0, last_touch: 0, assisted_touch: 0 }
    };
    bucket.events[event.event_type] = (bucket.events[event.event_type] || 0) + 1;
    bucket.channels[event.channel] = (bucket.channels[event.channel] || 0) + 1;
    bucket.score += safeNumber(weights[event.event_type]);

    if (event.attribution === 'first_touch') bucket.attribution.first_touch += 1;
    if (event.attribution === 'last_touch') bucket.attribution.last_touch += 1;
    if (event.attribution === 'assisted_touch') bucket.attribution.assisted_touch += 1;

    if (COMMERCIAL_TYPES.has(event.event_type)) {
      const key = event.order_id || event.event_id;
      if (!uniqueCommercial.has(key)) uniqueCommercial.set(key, event);
    }
  }

  let revenue = 0;
  let orders = 0;
  for (const event of uniqueCommercial.values()) {
    if (event.event_type === 'order') orders += 1;
    if (event.event_type === 'revenue') revenue += event.value;
    const bucket = content[event.content_id];
    if (event.event_type === 'order') bucket.orders += 1;
    if (event.event_type === 'revenue') bucket.revenue += event.value;
    bucket.score += event.event_type === 'revenue' ? event.value * safeNumber(weights.revenue ?? 1) : 0;
  }

  return {
    content,
    commercialTotals: { orders, revenue, currency: policy.revenueCurrency || 'EUR' },
    attribution: { uniqueCommercialEvents: uniqueCommercial.size }
  };
}
