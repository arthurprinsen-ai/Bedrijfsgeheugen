import {createPublicKey, verify} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// This is an evidence admission check, NEVER a production deploy or a tenant writer.
// Only a separately controlled verifier may sign authenticated customer readbacks.
// The signed claim still needs independent verification of its underlying receipts.
export const REQUIRED_EVENTS=Object.freeze([
  'scan_claim','goal_saved','brain_ack','impact_readback','action_executed',
  'result_measured','learning_writeback','connector_execution','forecast_readback'
]);
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9._:-]{8,160}$/;
const PRIVATE=/access_token|refresh_token|service_role|password|secret|authorization|private_key|email|phone|full_name/i;
const own=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const tidy=x=>Array.isArray(x)?x.map(tidy):x&&typeof x==='object'
  ?Object.fromEntries(Object.keys(x).sort().map(k=>[k,tidy(x[k])])):x;
const validTime=(s,now)=>{
  if(typeof s!=='string'||!/Z$/.test(s))return false;
  const t=Date.parse(s);
  return Number.isFinite(t)&&t<=now+300000&&now-t<=7*86400000;
};
const allValues=(obj,visit)=>{
  if(Array.isArray(obj))obj.forEach(x=>allValues(x,visit));
  else if(obj&&typeof obj==='object')for(const [k,v] of Object.entries(obj)){visit(k,v);allValues(v,visit);}
};

export function evaluateCustomerProductionAcceptance(packet,{expectedSha,verifierPublicKey,now=Date.now()}={}){
  const errors=[];
  const deny=(code)=>{if(!errors.includes(code))errors.push(code);};
  if(!SHA.test(expectedSha||''))deny('EXPECTED_MAIN_SHA_REQUIRED');
  const payload=packet?.payload;
  if(!payload||typeof payload!=='object'||Array.isArray(payload)){
    return {status:'BLOCKED',productionAccepted:false,eligibleForIndependentReview:false,errors:['SIGNED_PAYLOAD_REQUIRED',...errors]};
  }
  const raw=JSON.stringify(tidy(payload));
  if(Buffer.byteLength(raw)>256000)deny('PAYLOAD_TOO_LARGE');
  allValues(payload,(key)=>{if(PRIVATE.test(key))deny('SECRET_OR_PERSONAL_DATA_IN_EVIDENCE');});
  try{
    const key=createPublicKey(verifierPublicKey||'');
    const signature=typeof packet.signature==='string'&&/^[A-Za-z0-9+/]+={0,2}$/.test(packet.signature)
      ?Buffer.from(packet.signature,'base64'):Buffer.alloc(0);
    if(key.asymmetricKeyType!=='ed25519'||signature.length!==64||
      !verify(null,Buffer.from(raw),key,signature))deny('INDEPENDENT_SIGNATURE_INVALID');
  }catch{deny('INDEPENDENT_VERIFIER_PUBLIC_KEY_MISSING_OR_INVALID');}
  if(payload.contract!=='PORTAL_CUSTOMER_PRODUCTION_ACCEPTANCE_V1')deny('CONTRACT_INVALID');
  const release=payload.release||{};
  if(release.mainSha!==expectedSha||release.deployedSha!==expectedSha||
    release.deployState!=='ready'||!ID.test(release.deployId||''))deny('EXACT_DEPLOY_NOT_PROVEN');
  for(const check of ['required','codeql','portalReadback','authenticatedApi']){
    if(release[check]?.sha!==expectedSha||release[check]?.status!=='success'||
      !ID.test(release[check]?.receiptId||''))deny('RELEASE_CHECK_MISSING_'+check.toUpperCase());
  }
  if(!validTime(payload.observedAt,now))deny('PROOF_STALE_OR_FUTURE_DATED');
  const journeys=payload.journeys;
  if(!Array.isArray(journeys)||journeys.length!==2)deny('TWO_REAL_TENANTS_REQUIRED');
  const tenants=new Set(),principals=new Set(),receipts=new Set();
  for(const j of Array.isArray(journeys)?journeys:[]){
    if(typeof j?.tenantRef!=='string'||!/^t-[a-f0-9]{16,64}$/.test(j.tenantRef)||tenants.has(j.tenantRef))
      deny('TENANT_UNIQUE_PSEUDONYM_REQUIRED');
    if(typeof j?.principalRef!=='string'||!/^u-[a-f0-9]{16,64}$/.test(j.principalRef)||principals.has(j.principalRef))
      deny('PRINCIPAL_UNIQUE_PSEUDONYM_REQUIRED');
    tenants.add(j?.tenantRef);principals.add(j?.principalRef);
    if(j?.realCustomer!==true||j?.authenticated!==true||j?.synthetic!==false)deny('REAL_AUTHENTICATED_CUSTOMER_REQUIRED');
    const c=j?.checks||{};
    if(c.guestDenied!==true||c.demoSeparated!==true||c.crossTenantDenied!==true||
       c.crossTenantHttpStatus!==403&&c.crossTenantHttpStatus!==404||
       c.reloginPersisted!==true||c.accessibilityPass!==true||
       !Number.isInteger(c.registeredPages)||c.registeredPages<1||
       c.testedPages!==c.registeredPages)deny('PORTAL_FUNCTION_OR_ISOLATION_UNPROVEN');
    const events=j?.events||{};
    for(const kind of REQUIRED_EVENTS){
      const e=own(events,kind)?events[kind]:null;
      if(!e||e.status!=='PROVEN'||e.tenantRef!==j.tenantRef||e.releaseSha!==expectedSha||
        e.observedBy!=='INDEPENDENT_PRODUCTION_VERIFIER'||!ID.test(e.receiptId||'')||
        !validTime(e.observedAt,now)) {deny('UNPROVEN_EVENT_'+kind.toUpperCase());continue;}
      if(receipts.has(e.receiptId))deny('REPLAYED_EVIDENCE_RECEIPT');
      receipts.add(e.receiptId);
    }
    const g=events.goal_saved,b=events.brain_ack,i=events.impact_readback;
    if(!Number.isSafeInteger(g?.revision)||g.revision<1||b?.revision!==g.revision||
      i?.revision!==g.revision)deny('WRITE_BRAIN_IMPACT_LINEAGE_BROKEN');
    const a=events.action_executed,r=events.result_measured,l=events.learning_writeback;
    if(a?.goalReceiptId!==g?.receiptId||r?.actionReceiptId!==a?.receiptId||
       l?.outcomeReceiptId!==r?.receiptId||!ID.test(l?.nextDecisionId||''))
      deny('ACTION_OUTCOME_LEARNING_LOOP_BROKEN');
    if(!r?.actual||!Number.isFinite(r.actual.value)||
      !['EUR','hours','count'].includes(r.actual.unit)||
      !ID.test(r?.independentSourceReceiptId||''))deny('MEASURED_OUTCOME_MISSING');
    if(events.forecast_readback?.validation!=='INDEPENDENTLY_VALIDATED')
      deny('FORECAST_NOT_INDEPENDENTLY_VALIDATED');
  }
  return Object.freeze({
    contract:'PORTAL_CUSTOMER_PRODUCTION_ACCEPTANCE_V1',
    status:errors.length?'BLOCKED':'SIGNED_EVIDENCE_CONTRACT_VALID',
    // Signed assertions are NOT external provider readback and do not themselves authorize LIVE.
    productionAccepted:false,eligibleForIndependentReview:errors.length===0,
    checkedTenants:tenants.size,validatedEventTypes:REQUIRED_EVENTS.length,
    errors:Object.freeze(errors.sort())
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  let packet=null;
  try{if(process.argv[2])packet=JSON.parse(readFileSync(process.argv[2],'utf8'));}catch{}
  const report=evaluateCustomerProductionAcceptance(packet,{
    expectedSha:process.env.EXPECTED_MAIN_SHA,
    verifierPublicKey:process.env.PORTAL_ACCEPTANCE_VERIFIER_PUBLIC_KEY
  });
  process.stdout.write(JSON.stringify(report)+'\n');
  if(!report.eligibleForIndependentReview)process.exitCode=78;
}
