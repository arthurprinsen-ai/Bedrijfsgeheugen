#!/usr/bin/env node
// Supplier evidence worklist. Structural source receipts are NOT independent verification.
// Generic provider policies do not establish model-specific or customer-specific controls.
import fs from 'node:fs/promises';

export const REQUIRED_SUPPLIER_CLAIMS = Object.freeze([
 'model_id','status','pricing','capabilities','deployment','governance'
]);

export function classifySupplierClaim(evidence, claim) {
 const receipts=Array.isArray(evidence?.claim_evidence)
  ? evidence.claim_evidence.filter(r=>r?.claim===claim) : [];
 const complete=r=>typeof r.url==='string'&&r.url.startsWith('https://')&&
  typeof r.locator==='string'&&Boolean(r.locator.trim())&&
  typeof r.observed_value==='string'&&Boolean(r.observed_value.trim())&&
  r.checked_on===evidence.checked_on;
 const generic=r=>String(r.scope??'').includes('NOT model-specific')||
  r.verification_status==='PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED';
 const modelScoped=receipts.find(r=>complete(r)&&!generic(r));
 if(modelScoped) return 'MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED';
 if(receipts.some(r=>complete(r)&&generic(r))) return 'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF';
 return 'NO_USABLE_MODEL_SOURCE_RECEIPT';
}

export function supplierEvidenceWorklist(catalog) {
 if(!Array.isArray(catalog?.models)) throw new Error('INVALID_MODEL_CATALOG');
 const rows=[];
 const counters={
  model_scoped_receipts:0,
  provider_baseline_only:0,
  missing_or_incomplete_receipts:0
 };
 let fullyVerifiedModels=0;
 for(const model of catalog.models) {
  const e=model.verification_evidence||{};
  let allClaimsFullyDeclared=true;
  for(const claim of REQUIRED_SUPPLIER_CLAIMS) {
   const classification=classifySupplierClaim(e,claim);
   if(classification==='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED') counters.model_scoped_receipts++;
   else if(classification==='PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF') counters.provider_baseline_only++;
   else counters.missing_or_incomplete_receipts++;
   const fullyDeclared=e.claim_scope==='full'&&e.source_url===model.source&&
    e.checked_on===model.verified_at&&Array.isArray(e.verified_claims)&&
    e.verified_claims.includes(claim)&&!e.not_verified?.includes(claim);
   if(!fullyDeclared||classification!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED') {
    allClaimsFullyDeclared=false;
    rows.push({
     provider:model.provider,model_id:model.id,claim,official_source:model.source,
     status:'REQUIRES_INDEPENDENT_SUPPLIER_VERIFICATION',
     evidence_classification:classification,
     evidence_required:['official supplier source URL','exact document heading or locator',
       'observed value','independently checked date','model/claim scope'],
     existing_receipt_complete:classification==='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED',
     existing_claim_declared:Boolean(fullyDeclared)
    });
   }
  }
  if(allClaimsFullyDeclared) fullyVerifiedModels++;
 }
 const totalClaims=catalog.models.length*REQUIRED_SUPPLIER_CLAIMS.length;
 const unproven=counters.provider_baseline_only+counters.missing_or_incomplete_receipts;
 if(Object.values(counters).reduce((a,b)=>a+b,0)!==totalClaims)
  throw new Error('SUPPLIER_EVIDENCE_ACCOUNTING_MISMATCH');
 return {
  catalog_version:catalog.version,
  models:catalog.models.length,
  required_claims:REQUIRED_SUPPLIER_CLAIMS,
  total_claims:totalClaims,
  pending_claim_reviews:rows.length,
  missing_claim_specific_receipts:unproven,
  existing_complete_receipts:counters.model_scoped_receipts,
  evidence_classification:counters,
  fully_verified_models:fullyVerifiedModels,
  ready_for_full_supplier_acceptance:rows.length===0,
  worklist:rows,
  notice:'Presence of model-scoped supplier content is not independent certification. Generic supplier policies cannot establish tenant agreements, residency, retention, enabled controls or model-level deployment terms.'
 };
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href) {
 const catalog=JSON.parse(await fs.readFile('data/ai-model-catalog-v1.json','utf8'));
 const output=JSON.stringify(supplierEvidenceWorklist(catalog),null,2)+'\n';
 if(process.argv[2]) await fs.writeFile(process.argv[2],output);
 else process.stdout.write(output);
}
