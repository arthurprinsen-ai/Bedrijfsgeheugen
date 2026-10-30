// Source-backed, sanitized predictive runtime evidence for the existing admin Portal V2.
// This read-only projection is not a publisher, scheduler, or forecast verifier.
const incidentFingerprint='predictive|public-market|unfiltered-top80-crowds-out-valid-source-types|20261030-v1';
const safeCount=value=>Number.isSafeInteger(Number(value))&&Number(value)>=0?Number(value):null;
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const unavailable=reason=>({status:'UNVERIFIED',reason});

export function summarizePredictiveRunEvidence(healthRows,incidentRows,observedAt=new Date().toISOString()){
  if(!Array.isArray(healthRows)||!Array.isArray(incidentRows)||healthRows.length!==1||incidentRows.length!==1)
    return unavailable('INCOMPLETE_PREDICTIVE_READBACK');
  const run=healthRows[0],incident=incidentRows[0],evidence=incident?.evidence;
  if(!isObject(run)||!isObject(incident)||!isObject(evidence))
    return unavailable('INVALID_PREDICTIVE_SOURCE');
  const time=Date.parse(run.gemeten_op||'');
  const readTime=Date.parse(observedAt);
  if(!Number.isFinite(time)||!Number.isFinite(readTime)||time>readTime+60000||readTime-time>86400000)
    return unavailable('PREDICTIVE_RUN_STALE_OR_INVALID');
  const match=/^signals=(\d+); forecasts=(\d+); rejected=(\d+)$/.exec(String(run.detail||'').trim());
  const signals=match?safeCount(Number(match[1])):null;
  const forecasts=match?safeCount(Number(match[2])):null;
  const rejected=match?safeCount(Number(match[3])):null;
  const runtimeReceipt=run.status==='ok'&&signals!==null&&signals>0&&forecasts!==null&&rejected!==null;
  const deploymentReceipt=evidence.merged===true&&evidence.source_parity===true
    &&evidence.protected_merge_verified===true&&evidence.production_runtime_verified===true
    &&evidence.runtime_canary_proven===true&&evidence.authorized_runtime_http===200
    &&evidence.supabase_edge_version>=569;
  if(!runtimeReceipt||!deploymentReceipt)
    return unavailable('RUN_OR_DEPLOYMENT_PROOF_MISSING');
  return {
    status:'RUN_READBACK_PROVEN',authority:'Supabase bg_gezondheid + brain_failure_registry',
    observedAt,runObservedAt:run.gemeten_op,
    signals,forecasts,rejected,
    mergeProven:true,sourceParityProven:true,runtimeCanaryProven:true,
    learningMaturity:String(incident.maturity||'UNKNOWN').toUpperCase(),
    nextNaturalRunProven:evidence.next_natural_runtime_proven===true,
    realizedOutcomeProven:evidence.forecast_outcome_proven===true,
    commercialRevenueProven:evidence.commercial_revenue_proven===true,
    note:'Een geslaagde runtime bevestigt uitvoering, niet een gerealiseerde voorspelling of omzet.'
  };
}

export async function loadPredictiveRunEvidence({baseUrl,key,fetchImpl=globalThis.fetch}={}){
  if(!baseUrl||!key)return unavailable('PREDICTIVE_READBACK_CONFIG_MISSING');
  const base=String(baseUrl).replace(/\/$/,'')+'/rest/v1/';
  const healthUrl=base+'bg_gezondheid?select=gemeten_op,status,detail&onderdeel=eq.powerhouse-predictive-engine&soort=eq.predictive-run&order=gemeten_op.desc&limit=1';
  const incidentUrl=base+'brain_failure_registry?select=maturity,evidence&fingerprint=eq.'+encodeURIComponent(incidentFingerprint)+'&limit=1';
  const get=async url=>{
    const response=await fetchImpl(url,{headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json'},signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('PREDICTIVE_READBACK_HTTP_'+response.status);
    return response.json();
  };
  try{
    const [healthRows,incidentRows]=await Promise.all([get(healthUrl),get(incidentUrl)]);
    return summarizePredictiveRunEvidence(healthRows,incidentRows);
  }catch{return unavailable('PREDICTIVE_PROVIDER_READBACK_FAILED');}
}
