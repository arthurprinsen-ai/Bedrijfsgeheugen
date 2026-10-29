// Read-only, aggregate-only 24h evidence coverage for the existing admin Powerhouse portal.
// The source of truth remains public.powerhouse_cycle_events; no new writer or scheduler.
const PAGE_SIZE = 1000;
const MAX_ROWS = 4000;
const invalid = reason => ({status:'UNVERIFIED', reason});
const present = (record, key) => Object.prototype.hasOwnProperty.call(record,key)
  && record[key] != null && (typeof record[key] !== 'string' || record[key].trim() !== '');

export function summarizeCycleEvidenceCoverage(rows, expectedTotal, observedAt = new Date().toISOString()) {
  if (!Array.isArray(rows) || !Number.isSafeInteger(expectedTotal) || expectedTotal < 0
    || expectedTotal > MAX_ROWS || rows.length !== expectedTotal)
    return invalid('INCOMPLETE_CYCLE_EVENT_READBACK');
  if (Number.isNaN(Date.parse(observedAt))) return invalid('INVALID_OBSERVATION_TIME');
  const totals = {events:rows.length, evidenceRefs:0, idempotencyKeys:0, agentIds:0,
    skillVersions:0, beforeMetrics:0, afterMetrics:0, allFour:0,
    salesActionEvents:0, channelDecisionEvents:0, runtimeSignalEvents:0, otherEvents:0};
  const seen = new Set();
  let sourceLatestAt = null;
  for (const row of rows) {
    if (!row || typeof row !== 'object' || typeof row.event_id !== 'string'
      || !row.event_id || seen.has(row.event_id) || row.tenant_id !== 'canonical'
      || typeof row.entity_type !== 'string' || !row.entity_type.trim()
      || !row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload))
      return invalid('INVALID_OR_DUPLICATE_CYCLE_EVENT');
    if (!row.occurred_at || Number.isNaN(Date.parse(row.occurred_at)))
      return invalid('INVALID_CYCLE_EVENT_TIMESTAMP');
    seen.add(row.event_id);
    // Event producers and autonomous actors are distinct. SQL-generated
    // sales/channel decisions are never fabricated into agent IDs.
    if (row.entity_type==='sales_action' || row.entity_type==='powerhouse_sales_actions')
      totals.salesActionEvents++;
    else if (row.entity_type==='channel_decision') totals.channelDecisionEvents++;
    else if (row.entity_type==='powerhouse_runtime_events') totals.runtimeSignalEvents++;
    else totals.otherEvents++;
    if (present(row,'evidence_ref')) totals.evidenceRefs++;
    if (present(row,'idempotency_key')) totals.idempotencyKeys++;
    const actor=present(row.payload,'agent_id'), skill=present(row.payload,'skill_version');
    const before=present(row.payload,'before_metric'), after=present(row.payload,'after_metric');
    if (actor) totals.agentIds++;
    if (skill) totals.skillVersions++;
    if (before) totals.beforeMetrics++;
    if (after) totals.afterMetrics++;
    if (actor && skill && before && after) totals.allFour++;
    if (!sourceLatestAt || Date.parse(row.occurred_at)>Date.parse(sourceLatestAt))
      sourceLatestAt=row.occurred_at;
  }
  return {status:'READBACK_COMPLETE',authority:'public.powerhouse_cycle_events',
    tenantScope:'canonical',windowHours:24,observedAt,sourceLatestAt,totals,
    caveat:'Cycle events originate mainly from SQL sales/channel decision materializers. Entity type is not agent identity. Field presence is not proof of correct actor attribution, causal effect or paid revenue.'};
}

export async function loadCycleEvidenceCoverage({
  baseUrl, key, fetchImpl=globalThis.fetch, observedAt=new Date().toISOString()
}={}) {
  if (!baseUrl || !key) return {status:'UNAVAILABLE',reason:'CYCLE_COVERAGE_CONFIG_MISSING'};
  const end=Date.parse(observedAt);
  if (!Number.isFinite(end)) return invalid('INVALID_OBSERVATION_TIME');
  const start=new Date(end-86400000).toISOString(), stop=new Date(end).toISOString();
  const rows=[];
  let total=null;
  for (let offset=0;offset<MAX_ROWS;offset+=PAGE_SIZE) {
    const url=new URL(String(baseUrl).replace(/\/$/,'')+'/rest/v1/powerhouse_cycle_events');
    url.searchParams.set('select','event_id,tenant_id,entity_type,occurred_at,payload,evidence_ref,idempotency_key');
    url.searchParams.set('tenant_id','eq.canonical');
    url.searchParams.set('occurred_at',`gte.${start}`);
    url.searchParams.append('occurred_at',`lt.${stop}`);
    url.searchParams.set('order','occurred_at.asc,event_id.asc');
    url.searchParams.set('limit',String(PAGE_SIZE));
    url.searchParams.set('offset',String(offset));
    let response;
    try {
      response=await fetchImpl(url.toString(),{method:'GET',headers:{
        apikey:key,authorization:'Bearer '+key,accept:'application/json',prefer:'count=exact'
      },signal:AbortSignal.timeout(5000)});
      if (!response.ok) return {status:'UNAVAILABLE',reason:'CYCLE_COVERAGE_HTTP_'+response.status};
      const range=String(response.headers?.get('content-range')||'');
      const match=/\/(\d+)$/.exec(range);
      if (!match) return invalid('CYCLE_COVERAGE_TOTAL_UNKNOWN');
      const reported=Number(match[1]);
      if (!Number.isSafeInteger(reported) || reported<0 || (total!==null && reported!==total))
        return invalid('CYCLE_COVERAGE_COUNT_DRIFT');
      total=reported;
      if (total>MAX_ROWS) return invalid('CYCLE_COVERAGE_WINDOW_EXCEEDS_BOUNDED_LIMIT');
      const page=await response.json();
      if (!Array.isArray(page) || page.length>PAGE_SIZE || (total>0 && page.length===0))
        return invalid('CYCLE_COVERAGE_PARTIAL_PAGE');
      rows.push(...page);
      if (rows.length===total) return summarizeCycleEvidenceCoverage(rows,total,stop);
      if (rows.length>total) return invalid('CYCLE_COVERAGE_COUNT_DRIFT');
    } catch {
      return {status:'UNAVAILABLE',reason:'CYCLE_COVERAGE_READ_FAILED'};
    }
  }
  return invalid('CYCLE_COVERAGE_INCOMPLETE_BOUND');
}
