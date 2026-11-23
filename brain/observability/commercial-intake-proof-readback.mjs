// Pure, admin-only commercial intake proof projection from ORIGINAL ONE BRAIN.
// Never read client PII, never infer a paid order from a signed quote or a code release.
export const COMMERCIAL_INTAKE_PROOF_CONTRACT='commercial-intake-source-proof-v1';
export const COMMERCIAL_INTAKE_FINGERPRINT='powerhouse|commercial|verified-claim-conversion-gap-signed-quote-not-paid|20261102-v1';
export const COMMERCIAL_MIGRATION_FINGERPRINT='powerhouse|delivery|prod-applied-20261031135451-migration-absent-source|20261102-v1';
const approved=new Set(['VALIDATED','PROVEN']);

const isObject=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const getRow=(rows,fingerprint)=>rows.find(row=>row?.fingerprint===fingerprint)||null;
const safeDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value:null;
const unknown=(reason)=>({contract:COMMERCIAL_INTAKE_PROOF_CONTRACT,status:'UNVERIFIED',reason,
 sourceLive:false,paymentProven:false,authorizedClaimProven:false,recurrenceFreeProven:false,observedAt:null});

// The projection's only green is SOURCE_LIVE, never customer paid revenue/ROI.
// The original registry records production SHA and provider proof; this is a
// trusted summary of THAT evidence, not an additional direct database canary.
export function summarizeCommercialIntakeProof(rows,observedAt=new Date().toISOString()){
 if(!Array.isArray(rows)||rows.length!==2)return unknown('INCOMPLETE_OR_DUPLICATE_ORIGINAL_INCIDENT_READBACK');
 const a=getRow(rows,COMMERCIAL_INTAKE_FINGERPRINT);
 const m=getRow(rows,COMMERCIAL_MIGRATION_FINGERPRINT);
 if(!a||!m||!approved.has(a.maturity)||!approved.has(m.maturity))
   return unknown('ORIGINAL_INCIDENT_NOT_YET_VALIDATED');
 const e=isObject(a.evidence)?a.evidence:{};
 const r=isObject(e.production_readback)?e.production_readback:{};
 const h=isObject(m.evidence)?m.evidence:{};
 const required=['20261102074013','20261102075243'];
 const source= r.source_migrations_applied===true
   &&r.scan_insert_or_tenant_claim_update===true
   &&r.offer_verified_proposal_zero_revenue===true
   &&r.signature_is_paid_order===false
   &&r.anon_execute===false&&r.authenticated_execute===false
   &&required.every(id=>[r.source_migration_version,r.acl_finalizer_version].includes(id));
 const migration=h.provider_history_mirror_applied===true
   &&Array.isArray(h.native_migrations_verified)
   &&['20261031135451',...required].every(id=>h.native_migrations_verified.includes(id));
 if(!source||!migration)return unknown('ORIGINAL_PRODUCTION_SOURCE_OR_MIGRATION_PROOF_MISSING');
 return {
  contract:COMMERCIAL_INTAKE_PROOF_CONTRACT,
  status:'SOURCE_LIVE_CUSTOMER_OUTCOME_PENDING',
  reason:'Production trigger and ACL readback in original ONE BRAIN; no live customer order proof.',
  sourceLive:true,
  paymentProven:false,
  authorizedClaimProven:r.actual_authorized_claim_observed===true,
  recurrenceFreeProven:false,
  observedAt:safeDate(observedAt),
  source:'Supabase brain_failure_registry',
  issueUrl:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198'
 };
}

// Reuse original admin-gated service_role authority. No new scheduler/writer.
export async function loadCommercialIntakeProof({baseUrl,key,fetchImpl=globalThis.fetch}={}){
 if(!baseUrl||!key)return unknown('SERVICE_ROLE_SOURCE_UNAVAILABLE');
 const base=String(baseUrl).replace(/\/$/,'');
 const read=async fingerprint=>{
  const url=base+'/rest/v1/brain_failure_registry?select=fingerprint,maturity,evidence&fingerprint=eq.'+encodeURIComponent(fingerprint)+'&limit=1';
  const response=await fetchImpl(url,{
   method:'GET',headers:{apikey:key,authorization:'Bearer '+key,accept:'application/json'},
   signal:AbortSignal.timeout(5000)
  });
  if(!response.ok)throw Error('ORIGINAL_INCIDENT_PROVIDER_UNAVAILABLE');
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length!==1)throw Error('INCIDENT_SHAPE_INCOMPLETE');
  return rows[0];
 };
 try{
  const rows=await Promise.all([read(COMMERCIAL_INTAKE_FINGERPRINT),read(COMMERCIAL_MIGRATION_FINGERPRINT)]);
  return summarizeCommercialIntakeProof(rows);
 }catch{return unknown('ORIGINAL_INCIDENT_READBACK_FAILED');}
}
