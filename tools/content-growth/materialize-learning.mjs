import fs from 'node:fs';
import { aggregateContentPerformance } from './aggregate.mjs';
import { buildLearningContext } from './learning.mjs';

// The source universe contains idea/research signals as well as actual content
// performance. A research signal is not a measured publication or an order.
const SOURCE_ONLY_EVENT_TYPES = new Set(['problem_radar_signal_accepted']);

export function partitionContentLearningEvents(events) {
  if (!Array.isArray(events)) throw new TypeError('content growth events must be an array');
  const performanceEvents = [];
  const excludedSourceEvents = [];
  for (const raw of events) {
    if (raw && typeof raw === 'object' && SOURCE_ONLY_EVENT_TYPES.has(raw.event_type)) {
      excludedSourceEvents.push(String(raw.event_id || 'source-event-without-id'));
      continue;
    }
    // Everything else retains the strict canonical content_id requirement.
    // Missing IDs on orders/revenue must fail closed, never be inferred.
    performanceEvents.push(raw);
  }
  return { performanceEvents, excludedSourceEvents };
}

const [eventsPath = 'data/content-growth-events.json', policyPath = 'config/content-growth-policy.json', outputPath = 'data/content-growth-learning.json'] = process.argv.slice(2);
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const events = fs.existsSync(eventsPath) ? JSON.parse(fs.readFileSync(eventsPath, 'utf8')) : [];
const list = Array.isArray(events) ? events : (events.events || []);
const { performanceEvents, excludedSourceEvents } = partitionContentLearningEvents(list);
const performance = aggregateContentPerformance(performanceEvents, policy);
const learning = buildLearningContext({ performance, now: new Date(), policy });

// Preserve source-signal counts and bounded IDs, but never turn an upstream
// signal into fabricated reach, attribution, revenue or proven learning.
learning.ingestion = {
  input_events: list.length,
  performance_events: performanceEvents.length,
  excluded_source_only_events: excludedSourceEvents.length,
  excluded_source_event_ids_sample: [...new Set(excludedSourceEvents)].sort().slice(0, 12),
  source_type_boundary: 'research-signal-not-performance-v1'
};
learning.evidence_status = performanceEvents.length
  ? 'PERFORMANCE_EVENTS_PRESENT_PROVIDER_ATTRIBUTION_UNVERIFIED'
  : 'NO_OBSERVED_CONTENT_PERFORMANCE';
fs.mkdirSync(outputPath.split('/').slice(0, -1).join('/') || '.', { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(learning, null, 2)}\n`);
console.log(JSON.stringify({
  output: outputPath,
  observed_items: learning.confidence.observed_items,
  revenue: learning.commercial_totals.revenue,
  orders: learning.commercial_totals.orders,
  ...learning.ingestion,
  evidence_status: learning.evidence_status
}));
