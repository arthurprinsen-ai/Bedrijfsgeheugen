export const REQUIRED_TRACE_STAGES = ['Evidence','Signal','Opportunity','Decision','Mission','Outcome'];

export function buildTrace(events=[]) {
  const byTrace = new Map();
  for (const event of events) {
    const traceId = String(event?.trace_id || '').trim();
    if (!traceId) continue;
    if (!byTrace.has(traceId)) byTrace.set(traceId, []);
    byTrace.get(traceId).push(event);
  }
  return byTrace;
}

export function traceCompleteness(events=[], requiredStages=REQUIRED_TRACE_STAGES) {
  const present = new Set(events.map(e => String(e?.object_type || e?.type || '')).filter(Boolean));
  const missing = requiredStages.filter(stage => !present.has(stage));
  return {
    complete: missing.length === 0,
    missing,
    present: [...present]
  };
}
