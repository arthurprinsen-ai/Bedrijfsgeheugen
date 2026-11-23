// Read-only data minimization for authenticated non-admin tenants.
// Client-side hidden panels are never authorization boundaries.
const list=value=>Array.isArray(value)?value:[];
const record=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>Object.prototype.hasOwnProperty.call(record(value),key)).map(key=>[key,value[key]]));
export function projectCustomerSecurityTrustResponse(response){
 const outer=record(response),snapshot=outer.snapshot;
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw Object.assign(new Error('INVALID_SECURITY_SNAPSHOT'),{code:'SECURITY_TRUST_READ_FAILED'});
 const src=record(snapshot);
 return {
  snapshot:{
   generatedAt:src.generatedAt??null,
   summary:pick(src.summary,['postureStatus','evidenceCoverage','highRiskFindingCount']),
   findings:list(src.findings).map(row=>pick(row,['severity'])),
   providerAssurance:list(src.providerAssurance).map(row=>pick(row,['providerKey','assuranceScope','evidenceStatus','notes','evidenceUrls'])),
   frameworks:list(src.frameworks).map(row=>pick(row,['frameworkKey','label','applicability','notes','evidenceUrls'])),
   managementObservations:list(src.managementObservations).map(row=>pick(row,[
    'provider_key','control_key','providerKey','controlKey','status',
    'evidence_available','evidenceAvailable','observed_at','observedAt','expires_at','expiresAt'
   ]))
  }
 };
}
