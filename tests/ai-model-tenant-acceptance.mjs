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
 if(!r.signature) {errors.push(p+':MISSING_SIGNATURE');continue;}
 try {
  const publicKey=createPublicKey(keyPem);
  const valid=verify(null,Buffer.from(JSON.stringify(payload)),publicKey,Buffer.from(r.signature,'base64'));
  if(!valid) errors.push(p+':INVALID_SIGNATURE');
 } catch { errors.push(p+':INVALID_SIGNING_KEY_OR_SIGNATURE'); }
 if(!r.readback?.source||!isRecent(r.readback?.observed_at)||!r.readback?.identity||
    r.readback.identity!==r.tenant_id) errors.push(p+':LIVE_READBACK_UNPROVEN');
 if(r.claim==='signed_dpa' && r.readback?.source!=='approved_contract_repository') errors.push(p+':SIGNED_DPA_NOT_IN_APPROVED_VAULT');
 if(r.claim!=='signed_dpa' && r.readback?.source!=='authenticated_provider_api') errors.push(p+':PROVIDER_API_READBACK_REQUIRED');
}
const result={status:errors.length?'REJECTED':'PASS',attestation_count:Array.isArray(rows)?rows.length:0,errors,
 fingerprint:createHash('sha256').update(JSON.stringify(input)).digest('hex')};
console.log(JSON.stringify(result,null,2));
if(errors.length) process.exitCode=2;
