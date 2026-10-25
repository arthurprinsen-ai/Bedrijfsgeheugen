const PERFORMANCE_TYPES = new Set(['reach','impression','engagement','click','visit','cta','lead','qualified_lead','opportunity','order','revenue']);
const EXTERNAL_RESEARCH_TYPES = new Set(['problem_radar_signal_accepted']);

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
function sourceLink(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
export function partitionContentGrowthInputs(events, {now = new Date()} = {}) {
  if (!Array.isArray(events)) throw new Error('CONTENT_GROWTH_EVENTS_MUST_BE_ARRAY');
  const clock = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(clock.getTime())) throw new Error('CONTENT_GROWTH_INVALID_CLOCK');
  const performanceEvents = [];
  const researchObservations = [];
  const unique = new Set();
  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('CONTENT_GROWTH_EVENT_INVALID:' + index);
    const type = String(event.event_type ?? '');
    const contentId = typeof event.content_id === 'string' ? event.content_id.trim() : '';
    const id = String(event.event_id || '');
    if (id && unique.has(id)) throw new Error('CONTENT_GROWTH_DUPLICATE_EVENT_ID:' + id);
    if (id) unique.add(id);
    if (PERFORMANCE_TYPES.has(type)) {
      if (!contentId) throw new Error('CONTENT_GROWTH_UNATTRIBUTED_METRIC:' + index);
      if (event.source !== undefined && event.source !== null && typeof event.source !== 'string') {
        throw new Error('CONTENT_GROWTH_METRIC_SOURCE_INVALID:' + index);
      }
      performanceEvents.push(event);
      continue;
    }
    if (EXTERNAL_RESEARCH_TYPES.has(type)) {
      // Signals are never converted to traffic, leads or revenue.
      const url = sourceLink(event.source?.url);
      const sourceDate = event.source?.source_date;
      if (!url || !validDate(sourceDate) || !event.signal?.problem_summary) {
        throw new Error('CONTENT_GROWTH_EXTERNAL_EVIDENCE_INVALID:' + index);
      }
      const deadline = event.source_facts?.application_end;
      const endsAt = typeof deadline === 'string' ? new Date(deadline) : null;
      const expiryKnown = endsAt && !Number.isNaN(endsAt.getTime());
      researchObservations.push({
        event_id: id || 'index:' + index,
        event_type: type,
        source_url: url,
        source_publisher: String(event.source.publisher || ''),
        source_date: sourceDate,
        source_freshness: validDate(sourceDate) && sourceDate <= clock.toISOString().slice(0,10) ? 'DATED_SOURCE' : 'FUTURE_OR_UNVERIFIED',
        deadline_status: !expiryKnown ? 'UNKNOWN' : endsAt.getTime() < clock.getTime() ? 'EXPIRED' : 'NOT_EXPIRED',
        is_performance_measurement: false
      });
      continue;
    }
    throw new Error('CONTENT_GROWTH_UNCLASSIFIED_EVENT:' + index + ':' + type);
  }
  return {
    performanceEvents,
    researchObservations,
    provenance: {
      contract: 'content-growth-source-integrity-v1',
      performance_event_count: performanceEvents.length,
      external_research_count: researchObservations.length,
      expired_external_deadlines: researchObservations.filter(x => x.deadline_status === 'EXPIRED').length,
      measurement_status: performanceEvents.length ? 'ATTRIBUTED_EVENTS_AVAILABLE' : 'NO_ATTRIBUTED_PERFORMANCE_EVENTS',
      independent_provider_metrics_confirmed: false,
      limitations: ['This input is a repository evidence snapshot, not a live GA4, Search Console or social provider export', 'Neither absence of attributed events nor an external source signal proves zero leads or zero revenue']
    }
  };
}
