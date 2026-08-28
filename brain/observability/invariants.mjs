import {buildTrace, traceCompleteness} from './trace.mjs';

const terminalMissionStates = new Set(['VERIFIED','PRODUCTION_GREEN','BLOCKED_HARD_BOUNDARY']);

export function checkTrace(events=[]) {
  const violations=[];
  const traces=buildTrace(events);
  for(const [traceId,traceEvents] of traces) {
    const hasMission=traceEvents.some(e=>String(e?.object_type||e?.type||'')==='Mission');
    const hasOutcome=traceEvents.some(e=>String(e?.object_type||e?.type||'')==='Outcome');
    if(hasMission&&!hasOutcome) violations.push('MISSING_OUTCOME');
    const completion=traceCompleteness(traceEvents);
    if(hasOutcome&&!completion.complete) violations.push('INCOMPLETE_TRACE_LINEAGE');
    if(traceEvents.some(e=>e.trace_id!==traceId)) violations.push('BROKEN_TRACE_LINEAGE');
  }
  return {ok:violations.length===0,violations};
}

function legacyCheck(s={}) {
  const v=[];
  if(Number(s.current_state_age_hours||0)>Number(s.max_state_age_hours??Infinity))v.push('STALE_CURRENT_STATE');
  const keys=s.idempotency_keys||[];
  if(new Set(keys).size!==keys.length)v.push('DUPLICATE_IDEMPOTENCY_KEY');
  if(s.production_status==='PRODUCTION_GREEN'&&(!s.exact_production_sha||s.verified_production!==true))v.push('INVALID_PRODUCTION_GREEN');
  if(Number(s.heartbeat_age_minutes||0)>Number(s.max_heartbeat_minutes??Infinity))v.push('MISSING_HEARTBEAT');
  if(s.parent_lineage_valid===false)v.push('BROKEN_PARENT_LINEAGE');
  return {ok:v.length===0,violations:v,recovery_signals:v.map((code,i)=>({id:`obs-legacy-${i}-${code}`,object_type:'Signal',signal_type:'OPERATIONAL_INVARIANT_VIOLATION',severity:'high',code,evidence:{code}}))};
}

export function checkInvariants(input={}) {
  if(!Object.prototype.hasOwnProperty.call(input,'events') && !Object.prototype.hasOwnProperty.call(input,'currentStates')) return legacyCheck(input);
  const {events=[], currentStates=[], now=new Date().toISOString(), heartbeatMaxAgeMs=15*60*1000}=input;
  const violations=[];
  const ids=new Set(events.map(x=>x?.id).filter(Boolean));
  const seenIdempotency=new Map();

  for (const e of events) {
    if (e?.idempotency_key) {
      const key=String(e.idempotency_key);
      if (seenIdempotency.has(key) && seenIdempotency.get(key)!==e.id) violations.push({code:'DUPLICATE_IDEMPOTENCY_KEY',severity:'high',refs:[seenIdempotency.get(key),e.id],idempotency_key:key});
      else seenIdempotency.set(key,e.id);
    }
    if (Array.isArray(e?.parent_refs) && e.parent_refs.length) {
      const missing=e.parent_refs.filter(ref=>!ids.has(ref));
      if(missing.length) violations.push({code:'BROKEN_PARENT_LINEAGE',severity:'high',event_id:e.id,missing_refs:missing});
    }
    const type=String(e?.object_type||e?.type||'');
    if(type==='Mission' && terminalMissionStates.has(String(e?.status||'')) && String(e?.status)!=='BLOCKED_HARD_BOUNDARY') {
      const hasOutcome=events.some(x=>String(x?.object_type||x?.type||'')==='Outcome' && (x?.mission_id===e.id || (x?.parent_refs||[]).includes(e.id)));
      if(!hasOutcome) violations.push({code:'TERMINAL_MISSION_WITHOUT_OUTCOME',severity:'high',mission_id:e.id});
    }
    if(type==='Mission' && String(e?.status)==='PRODUCTION_GREEN' && (!e?.production_sha || e?.production_verified!==true)) violations.push({code:'INVALID_PRODUCTION_GREEN',severity:'critical',mission_id:e.id});
  }

  const traces=buildTrace(events);
  for(const [traceId,traceEvents] of traces) {
    const hasMission=traceEvents.some(e=>String(e?.object_type||e?.type||'')==='Mission');
    const hasOutcome=traceEvents.some(e=>String(e?.object_type||e?.type||'')==='Outcome');
    if(hasMission && !hasOutcome) violations.push({code:'TRACE_MISSING_OUTCOME',severity:'high',trace_id:traceId});
    const completion=traceCompleteness(traceEvents);
    if(hasOutcome && !completion.complete) violations.push({code:'INCOMPLETE_TRACE_LINEAGE',severity:'medium',trace_id:traceId,missing:completion.missing});
  }

  const nowMs=new Date(now).getTime();
  for(const s of currentStates) {
    const verifiedMs=new Date(s?.last_verified_at||s?.updated_at||0).getTime();
    const maxAge=Number(s?.max_age_ms??60*60*1000);
    if(Number.isFinite(verifiedMs) && nowMs-verifiedMs>maxAge) violations.push({code:'STALE_CURRENT_STATE',severity:'medium',entity_ref:s?.entity_ref,state_type:s?.state_type});
  }
  const heartbeat=events.filter(e=>String(e?.type||e?.object_type||'')==='HEARTBEAT').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
  if(!heartbeat || nowMs-new Date(heartbeat.created_at).getTime()>heartbeatMaxAgeMs) violations.push({code:'MISSING_HEARTBEAT',severity:'high'});

  return {healthy:violations.every(v=>!['high','critical'].includes(v.severity)),violations,recovery_signals:violations.map((v,i)=>({id:`obs-${i}-${v.code}`,object_type:'Signal',signal_type:'OPERATIONAL_INVARIANT_VIOLATION',severity:v.severity,code:v.code,trace_id:v.trace_id||null,evidence:{...v}}))};
}
