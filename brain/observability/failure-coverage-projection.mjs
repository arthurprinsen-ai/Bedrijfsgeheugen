// Aggregated error completeness for the existing authenticated admin portal.
const missing = value => value == null || String(value).trim() === '';
export function summarizeFailureCoverage(rows, expectedTotal, observedAt = new Date().toISOString()) {
  if (!Array.isArray(rows) || !Number.isSafeInteger(expectedTotal) || rows.length !== expectedTotal || expectedTotal > 1000)
    return {status:'UNVERIFIED',reason:'INCOMPLETE_REGISTRY_READBACK'};
  const totals = {patterns:rows.length,observed:0,validated:0,proven:0,other:0,observedMissingCause:0,observedMissingRegression:0,observedMissingPrevention:0};
  let sourceLatestAt = null;
  for (const row of rows) {
    if (!row || typeof row !== 'object') return {status:'UNVERIFIED',reason:'INVALID_REGISTRY_RECORD'};
    const maturity = String(row.maturity || '').toUpperCase();
    if (maturity === 'OBSERVED') {
      totals.observed++;
      if (missing(row.root_cause)) totals.observedMissingCause++;
      if (missing(row.regression_ref)) totals.observedMissingRegression++;
      if (missing(row.prevention_rule)) totals.observedMissingPrevention++;
    } else if (maturity === 'VALIDATED') totals.validated++;
    else if (maturity === 'PROVEN') totals.proven++;
    else totals.other++;
    if (typeof row.last_seen_at === 'string' && !Number.isNaN(Date.parse(row.last_seen_at)) &&
      (!sourceLatestAt || Date.parse(row.last_seen_at) > Date.parse(sourceLatestAt))) sourceLatestAt = row.last_seen_at;
  }
  return {status:'READBACK_COMPLETE',authority:'Supabase brain_failure_registry',totals,observedAt,sourceLatestAt};
}
// Only a bounded, whitelisted incident summary leaves the admin-only server.
// Raw incident evidence, source IDs, and forecast content stay in Supabase.
const PREDICTIVE_PUBLIC_SOURCE_FINGERPRINT='predictive|public-market|unfiltered-top80-crowds-out-valid-source-types|20261030-v1';
export function summarizePredictiveSourceRecovery(row){
  if(!row||row.fingerprint!==PREDICTIVE_PUBLIC_SOURCE_FINGERPRINT)
    return {status:'UNVERIFIED',reason:'PREDICTIVE_INCIDENT_NOT_RETURNED'};
  const evidence=row.evidence&&typeof row.evidence==='object'&&!Array.isArray(row.evidence)?row.evidence:{};
  const technical= evidence.runtime_canary_proven===true
    && evidence.source_parity===true
    && evidence.authorized_runtime_http===200
    && Number(evidence.new_forecasts_written)>0
    && Number(evidence.independent_db_forecast_evidence_count)>=2;
  const natural=evidence.next_natural_runtime_proven===true;
  const maturity=['OBSERVED','VALIDATED','PROVEN'].includes(String(row.maturity||'').toUpperCase())?String(row.maturity).toUpperCase():'UNVERIFIED';
  const outcome=evidence.forecast_outcome_proven===true&&maturity==='PROVEN';
  return {
    status:technical?(natural?(outcome?'OUTCOME_EVIDENCE_PROVEN':'NATURAL_RUNTIME_PROVEN_OUTCOME_PENDING'):'TECHNICAL_RUNTIME_PROVEN_NATURAL_PENDING'):'RECOVERY_EVIDENCE_PENDING',
    maturity,
    technicalRuntimeProven:technical,
    naturalRuntimeProven:technical&&natural,
    outcomeProven:technical&&natural&&outcome,
    observedAt:typeof row.last_seen_at==='string'&&Number.isFinite(Date.parse(row.last_seen_at))?row.last_seen_at:null
  };
}

// Reads only server-to-server; only aggregate counts enter the browser response.
export async function loadFailureCoverage({baseUrl,key,fetchImpl=globalThis.fetch}={}) {
  if (!baseUrl || !key) return {status:'UNAVAILABLE',reason:'FAILURE_COVERAGE_CONFIG_MISSING'};
  const url=String(baseUrl).replace(/\/$/,'')+'/rest/v1/brain_failure_registry?select=maturity,root_cause,regression_ref,prevention_rule,last_seen_at&limit=1000';
  try {
    const response=await fetchImpl(url,{method:'GET',headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json',prefer:'count=exact'},signal:AbortSignal.timeout(5000)});
    if (!response.ok) return {status:'UNAVAILABLE',reason:'FAILURE_COVERAGE_HTTP_'+response.status};
    const contentRange=response.headers.get('content-range')||'';
    const match=/\/(\d+)$/.exec(contentRange);
    const aggregate=summarizeFailureCoverage(await response.json(),match?Number(match[1]):null);
    if(aggregate.status!=='READBACK_COMPLETE')return {...aggregate,predictiveRecovery:{status:'UNVERIFIED',reason:'INCOMPLETE_REGISTRY_READBACK'}};
    const incidentUrl=String(baseUrl).replace(/\/$/,'')+'/rest/v1/brain_failure_registry?select=fingerprint,maturity,evidence,last_seen_at&fingerprint=eq.'+encodeURIComponent(PREDICTIVE_PUBLIC_SOURCE_FINGERPRINT)+'&limit=1';
    try{
      const evidenceResponse=await fetchImpl(incidentUrl,{method:'GET',headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json'},signal:AbortSignal.timeout(5000)});
      if(!evidenceResponse.ok)return {...aggregate,predictiveRecovery:{status:'UNVERIFIED',reason:'INCIDENT_READBACK_HTTP_'+evidenceResponse.status}};
      const rows=await evidenceResponse.json();
      return {...aggregate,predictiveRecovery:summarizePredictiveSourceRecovery(Array.isArray(rows)&&rows.length===1?rows[0]:null)};
    }catch{
      return {...aggregate,predictiveRecovery:{status:'UNVERIFIED',reason:'INCIDENT_READBACK_FAILED'}};
    }
  } catch {
    return {status:'UNAVAILABLE',reason:'FAILURE_COVERAGE_READ_FAILED'};
  }
}
