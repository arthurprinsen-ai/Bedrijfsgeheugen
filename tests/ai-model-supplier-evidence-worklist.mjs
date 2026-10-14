#!/usr/bin/env node
// Deterministic supplier evidence worklist. Never modifies model claims or verification dates.
import fs from 'node:fs/promises';
const required=Object.freeze(['model_id','status','pricing','capabilities','deployment','governance']);
export function supplierEvidenceWorklist(catalog){
 if(!Array.isArray(catalog?.models))throw new Error('INVALID_MODEL_CATALOG');
 const rows=[];
 let missingReceipts=0;
 for(const model of catalog.models){
  const e=model.verification_evidence||{};
  for(const claim of required){
   const receipt=(Array.isArray(e.claim_evidence)?e.claim_evidence:[]).find(r=>
     r.claim===claim&&typeof r.url==='string'&&r.url.startsWith('https://')&&
     typeof r.locator==='string'&&r.locator.trim()&&
     typeof r.observed_value==='string'&&r.observed_value.trim()&&
     r.checked_on===e.checked_on && !String(r.scope??'').includes('NOT model-specific') && r.verification_status!=='PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED');
   const fullyDeclared=e.claim_scope==='full'&&e.source_url===model.source&&
     e.checked_on===model.verified_at&&Array.isArray(e.verified_claims)&&e.verified_claims.includes(claim)&&
     !e.not_verified?.includes(claim);
   if(!receipt)missingReceipts++;
   if(!receipt||!fullyDeclared)rows.push({
    provider:model.provider,model_id:model.id,claim,official_source:model.source,
    status:'REQUIRES_INDEPENDENT_SUPPLIER_VERIFICATION',
    evidence_required:['official supplier source URL','exact document heading or locator','observed value','independently checked date','model/claim scope'],
    existing_receipt_complete:Boolean(receipt),existing_claim_declared:Boolean(fullyDeclared)
   });
  }
 }
 return {catalog_version:catalog.version,models:catalog.models.length,required_claims:required,
  pending_claim_reviews:rows.length,missing_claim_specific_receipts:missingReceipts,
  existing_complete_receipts:catalog.models.length*required.length-missingReceipts,
  ready_for_full_supplier_acceptance:rows.length===0,worklist:rows,
  notice:'This worklist is not supplier evidence. Customer contracts, residency and runtime configuration require separate authorized checks.'};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const catalog=JSON.parse(await fs.readFile('data/ai-model-catalog-v1.json','utf8'));
 const output=JSON.stringify(supplierEvidenceWorklist(catalog),null,2)+'\n';
 if(process.argv[2])await fs.writeFile(process.argv[2],output);else process.stdout.write(output);
}
