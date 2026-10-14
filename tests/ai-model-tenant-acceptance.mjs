#!/usr/bin/env node
// Validate tenant-specific contract attestations and live configuration readback.
// Input is a private, access-controlled JSON file, never committed to GitHub.
// Usage: node tests/ai-model-tenant-acceptance.mjs /secure/attestations.json
import fs from 'node:fs/promises';
import { createHash, createPublicKey, verify } from 'node:crypto';
const filename=process.argv[2];
if (!filename) { console.error('PRIVATE_ATTESTATION_FILE_REQUIRED'); process.exit(2); }
const input=JSON.parse(await fs.readFile(filename,'utf8'));
const errors=[];
const claims=['signed_dpa','tenant_data_residency','tenant_zdr','customer_cmk','private_networking_enabled'];
const referenceDate=new Date();
const isRecent=x=>{const d=new Date(x);return Number.isFinite(+d)&&d<=referenceDate&&referenceDate-d<=14*86400000;};
const keyPem=process.env.TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM;
if (!keyPem) errors.push('VERIFICATION_PUBLIC_KEY_REQUIRED');
const rows=input.attestations;
// Every requested customer/model scope needs all compulsory claims; provider runtime checks remain mandatory.
const requestedScopes=Array.isArray(input.scopes)?input.scopes:[];
if(!requestedScopes.length) errors.push('NO_EXPLICIT_CUSTOMER_MODEL_SCOPES');
for(const [i,scope] of requestedScopes.entries()) {
 if(!scope?.tenant_id||!scope?.provider||!scope?.model_id) { errors.push('scopes['+i+']:INVALID_SCOPE');continue; }
 for(const claim of claims) {
  const matches=(Array.isArray(rows)?rows:[]).filter(r=>r.tenant_id===scope.tenant_id&&r.provider===scope.provider&&r.model_id===scope.model_id&&r.claim===claim);
  if(matches.length!==1) errors.push('scopes['+i+']:MISSING_OR_DUPLICATE_CLAIM:'+claim);
 }
}
for(const [i,row] of (Array.isArray(rows)?rows:[]).entries()) {
 if(!requestedScopes.some(scope=>scope.tenant_id===row.tenant_id&&scope.provider===row.provider&&scope.model_id===row.model_id)) errors.push('attestations['+i+']:UNREQUESTED_CUSTOMER_MODEL_SCOPE');
}
if (!Array.isArray(rows)||!rows.length) errors.push('NO_TENANT_ATTESTATIONS');
for(const [index,r] of (Array.isArray(rows)?rows:[]).entries()){
 const p='attestations['+index+']';
 if(!r.tenant_id||!r.provider||!r.model_id||!claims.includes(r.claim)) { errors.push(p+':BAD_IDENTITY_OR_CLAIM'); continue; }
 if(!r.evidence_reference||!r.approved_by||!isRecent(r.checked_at)) errors.push(p+':MISSING_APPROVAL_OR_STALE');
 // Signed immutable digest: approved payload is separately stored in secure evidence vault.
 const payload={tenant_id:r.tenant_id,provider:r.provider,model_id:r.model_id,claim:r.claim,
  evidence_reference:r.evidence_reference,approved_by:r.approved_by,checked_at:r.checked_at,
  observed_value:r.observed_value,expected_value:r.expected_value,readback:r.readback};
 if(r.observed_value===undefined||r.expected_value===undefined||r.observed_value!==r.expected_value) errors.push(p+':CONFIGURATION_READBACK_MISMATCH');
 // A matching disabled control is not proof of an enabled security option.
 if(['tenant_zdr','customer_cmk','private_networking_enabled'].includes(r.claim) &&
    (r.expected_value!==true || r.observed_value!==true))
   errors.push(p+':REQUIRED_SECURITY_CONTROL_NOT_ENABLED');
 // Residency is a concrete tenant-bound location, not a boolean, vague region, or empty string.
 if(r.claim==='tenant_data_residency' &&
    (typeof r.expected_value!=='string' || !/^[a-z]{2}(?:-[a-z0-9]+)+$/i.test(r.expected_value) ||
     r.observed_value!==r.expected_value))
   errors.push(p+':TENANT_RESIDENCY_REGION_UNVERIFIED');
 // A matching readback of 'disabled' is not evidence that a requested security control is enabled.
 if(['tenant_zdr','customer_cmk','private_networking_enabled'].includes(r.claim) &&
    (r.expected_value!==true || r.observed_value!==true))
   errors.push(p+':SECURITY_CONTROL_NOT_ENABLED');
 // Residency must be a positive, explicit runtime location rather than a generic boolean.
 if(r.claim==='tenant_data_residency' &&
    (typeof r.expected_value!=='string' || !r.expected_value.trim() ||
     typeof r.observed_value!=='string' || !r.observed_value.trim()))
   errors.push(p+':RESIDENCY_LOCATION_UNVERIFIED');
 if(!r.signature) {errors.push(p+':MISSING_SIGNATURE');continue;}
 try {
  const publicKey=createPublicKey(keyPem);
  const valid=verify(null,Buffer.from(JSON.stringify(payload)),publicKey,Buffer.from(r.signature,'base64'));
  if(!valid) errors.push(p+':INVALID_SIGNATURE');
 } catch { errors.push(p+':INVALID_SIGNING_KEY_OR_SIGNATURE'); }
 if(!r.readback?.source||!isRecent(r.readback?.observed_at)||!r.readback?.identity||
    r.readback.identity!==r.tenant_id) errors.push(p+':LIVE_READBACK_UNPROVEN');
 // A signed statement cannot assert a control independently of its readback value.
 // Preserve value-type distinctions and reject omitted readback values.
 if (!r.readback || !Object.hasOwn(r.readback,'observed_value') ||
     JSON.stringify(r.readback.observed_value)!==JSON.stringify(r.observed_value))
   errors.push(p+':READBACK_VALUE_MISMATCH');
 // Perform the actual provider readback through a pinned HTTPS endpoint.
 // This is deliberately fail-closed; no endpoint, token or matching tenant => no approval.
 if (r.claim !== 'signed_dpa') {
   const endpoint=process.env.TENANT_LIVE_READBACK_ENDPOINT;
   const token=process.env.TENANT_LIVE_READBACK_TOKEN;
   const allowedOrigin=process.env.TENANT_LIVE_READBACK_ALLOWED_ORIGIN;
   try {
     if(!endpoint || !token || !allowedOrigin) throw new Error('LIVE_PROVIDER_CONNECTION_REQUIRED');
     const target=new URL(endpoint), origin=new URL(allowedOrigin);
     if(target.protocol!=='https:' || origin.protocol!=='https:' ||
        target.origin!==origin.origin || !target.pathname.startsWith('/'))
       throw new Error('INVALID_PINNED_PROVIDER_ENDPOINT');
     const response=await fetch(target,{method:'POST',redirect:'error',
       signal:AbortSignal.timeout(12000),
       headers:{'content-type':'application/json','authorization':'Bearer '+token},
       body:JSON.stringify({tenant_id:r.tenant_id,provider:r.provider,model_id:r.model_id,claim:r.claim})});
     if(!response.ok) throw new Error('PROVIDER_READBACK_HTTP_'+response.status);
     const live=await response.json();
     if(live.tenant_id!==r.tenant_id || live.model_id!==r.model_id ||
        live.provider!==r.provider || live.claim!==r.claim ||
        JSON.stringify(live.observed_value)!==JSON.stringify(r.expected_value))
       throw new Error('LIVE_PROVIDER_CONFIGURATION_MISMATCH');
     if(!isRecent(live.observed_at)) throw new Error('LIVE_PROVIDER_READBACK_STALE');
   } catch(error) { errors.push(p+':'+String(error.message??error)); }
 }
 // A repository label and signed attestation do not prove that a DPA exists.
 // Require a separate authenticated contract-vault verification for contract claims.
 if(r.claim==='signed_dpa'){
  try {
   const endpoint=process.env.TENANT_CONTRACT_VERIFY_ENDPOINT;
   const origin=process.env.TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN;
   const token=process.env.TENANT_CONTRACT_VERIFY_TOKEN;
   if(!endpoint||!origin||!token) throw new Error('CONTRACT_VAULT_CONNECTION_REQUIRED');
   const url=new URL(endpoint),allowed=new URL(origin);
   if(url.protocol!=='https:'||allowed.protocol!=='https:'||url.origin!==allowed.origin)
    throw new Error('INVALID_PINNED_CONTRACT_ENDPOINT');
   const response=await fetch(url,{method:'POST',redirect:'error',
    signal:AbortSignal.timeout(12000),
    headers:{'content-type':'application/json',authorization:'Bearer '+token},
    body:JSON.stringify({tenant_id:r.tenant_id,provider:r.provider,
     model_id:r.model_id,evidence_reference:r.evidence_reference})});
   if(!response.ok) throw new Error('CONTRACT_VAULT_HTTP_'+response.status);
   const receipt=await response.json();
   if(receipt.tenant_id!==r.tenant_id||receipt.provider!==r.provider||
      receipt.model_id!==r.model_id||receipt.evidence_reference!==r.evidence_reference||
      receipt.signature_valid!==true||receipt.approved!==true||
      receipt.approved_by!==r.approved_by||
      receipt.agreement_status!=='executed'||
      !isRecent(receipt.verified_at))
    throw new Error('SIGNED_CONTRACT_NOT_AUTHENTICATED');
  }catch(error){errors.push(p+':'+String(error.message??error));}
 }
 if(r.claim==='signed_dpa' && r.readback?.source!=='approved_contract_repository') errors.push(p+':SIGNED_DPA_NOT_IN_APPROVED_VAULT');
 if(r.claim!=='signed_dpa' && r.readback?.source!=='authenticated_provider_api') errors.push(p+':PROVIDER_API_READBACK_REQUIRED');
}
const result={status:errors.length?'REJECTED':'PASS',attestation_count:Array.isArray(rows)?rows.length:0,errors,
 fingerprint:createHash('sha256').update(JSON.stringify(input)).digest('hex')};
console.log(JSON.stringify(result,null,2));
if(errors.length) process.exitCode=2;
