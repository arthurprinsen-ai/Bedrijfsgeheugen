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
 // A supplier-wide retention/security policy is not a model-specific governance receipt.
 // Some providers label baseline policies OFFICIAL_POLICY_OBSERVED_TENANT_UNVERIFIED;
 // only a statement naming the model's own retention eligibility is model-scoped.
 const generic=r=>{
  const scope=String(r.scope??'');
  const status=String(r.verification_status??'');
  const locator=String(r.locator??'');
  return scope.includes('NOT model-specific')||
   // A stateless Responses endpoint is API behavior, not model-wide governance evidence.
   (claim==='governance'&&scope.includes('endpoint-only supplier fact'))||
   status==='PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED'||
   // DeepSeek API platform terms apply to the service, not either exact model.
   (claim==='governance'&&(
    scope==='API_PLATFORM_TERMS_BASELINE_ONLY'||
    // A stateless API endpoint establishes transport behavior, not
    // model-specific data handling, processing contracts or tenant controls.
    scope==='endpoint-only supplier fact, not platform-wide/tenant retention guarantee'||
    status==='PROVIDER_POLICY_DOCUMENTED_CUSTOMER_DEPLOYMENT_UNVERIFIED'))||
   (claim==='governance'&&/^(verified supplier-wide|verified supplier-level)/.test(scope))||
   (claim==='governance'&&status==='OFFICIAL_POLICY_OBSERVED_TENANT_UNVERIFIED'&&
    !/Model-specific data retention requirements|Covered Model/i.test(locator))||
   // An API-wide policy is baseline evidence unless it explicitly names a covered
   // model's different retention obligation; a separate exact model page is scoped.
   (claim==='governance'&&status==='OFFICIAL_SUPPLIER_POLICY_CONFIRMED_TENANT_UNVERIFIED'&&
    String(r.url??'').includes('api-and-data-retention')&&
    !/is a Covered Model requiring/i.test(String(r.observed_value??'')));
 };
 // Historical prices, examples, unverified API tariffs and modality fragments are
 // useful context but must not certify a complete, current model-specific price.
 const partialPricing=r=>claim==='pricing'&&
  /UNVERIFIED|NOT_LIVE|HISTORICAL|PARTIAL|EXAMPLE|UNKNOWN|BASIS_ONLY/.test(String(r.verification_status??'').toUpperCase());
 const modelScoped=receipts.find(r=>complete(r)&&!generic(r)&&!partialPricing(r));
 if(modelScoped) return 'MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED';
 if(receipts.some(r=>complete(r)&&generic(r))) return 'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF';
 return 'NO_USABLE_MODEL_SOURCE_RECEIPT';
}


/**
 * Recompute materialized evidence classifications from existing receipts only.
 * This never creates receipts, timestamps, independent approvals or customer evidence.
 * Use --check to detect drift and --reconcile for an explicit, fail-closed repair.
 */
export function reconcileSupplierAudit(catalog,{apply=false}={}) {
 if(!Array.isArray(catalog?.models)) throw new Error('INVALID_MODEL_CATALOG');
 const changed_model_ids=[];
 for(const model of catalog.models) {
  const audit=model.supplier_audit;
  if(!audit||typeof audit!=='object') throw new Error('SUPPLIER_AUDIT_MISSING:'+model.id);
  const classifications=Object.fromEntries(
   REQUIRED_SUPPLIER_CLAIMS.map(claim=>[claim,classifySupplierClaim(model.verification_evidence,claim)])
  );
  const missing=REQUIRED_SUPPLIER_CLAIMS.filter(
   claim=>classifications[claim]!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED'
  );
  const evidence=model.verification_evidence||{};
  const reviews=REQUIRED_SUPPLIER_CLAIMS.filter(claim=>
   !(classifications[claim]==='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED'&&
     evidence.claim_scope==='full'&&evidence.source_url===model.source&&
     evidence.checked_on===model.verified_at&&
     evidence.verified_claims?.includes(claim)&&!evidence.not_verified?.includes(claim))
  );
  const previous=audit.claim_evidence_classification||{};
  const changed=REQUIRED_SUPPLIER_CLAIMS.some(claim=>previous[claim]!==classifications[claim])||
   JSON.stringify(audit.missing_claim_receipts)!==JSON.stringify(missing)||
   audit.missing_receipt_count!==missing.length||
   JSON.stringify(audit.review_required_claims)!==JSON.stringify(reviews)||
   audit.pending_independent_claim_reviews!==reviews.length;
  if(changed) {
   changed_model_ids.push(model.id);
   if(apply) {
    audit.claim_evidence_classification=classifications;
    audit.missing_claim_receipts=missing;
    audit.missing_receipt_count=missing.length;
    audit.review_required_claims=reviews;
    audit.pending_independent_claim_reviews=reviews.length;
    // Reconciled receipts require a fresh independent decision, never approval by repair.
    audit.independent_verification_required=true;
    audit.automatic_recommendation_eligible=false;
   }
  }
 }
 return {models:catalog.models.length,changed_models:changed_model_ids.length,
  changed_model_ids,applied:apply,
  assurance:'Only derived supplier-audit accounting was reconciled. No claim was verified or approved.'};
}

export function supplierEvidenceWorklist(catalog) {
 if(!Array.isArray(catalog?.models)) throw new Error('INVALID_MODEL_CATALOG');
 const rows=[];
 const counters={
  model_scoped_receipts:0,
  provider_baseline_only:0,
  missing_or_incomplete_receipts:0
 };
 let structurallyCompleteModels=0;
 let independentlyAcceptedModels=0;
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
  if(allClaimsFullyDeclared) structurallyCompleteModels++;
  // A complete receipt shape is not an independent supplier decision.
  // Acceptance requires an explicit, non-pending audit and eligibility flag.
  if(allClaimsFullyDeclared && model.supplier_audit?.independent_verification_required===false &&
     model.supplier_audit?.automatic_recommendation_eligible===true) independentlyAcceptedModels++;
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
  structurally_complete_models:structurallyCompleteModels,
  independently_accepted_models:independentlyAcceptedModels,
  pending_independent_model_reviews:catalog.models.length-independentlyAcceptedModels,
  fully_verified_models:independentlyAcceptedModels,
  ready_for_full_supplier_acceptance:rows.length===0 && independentlyAcceptedModels===catalog.models.length,
  worklist:rows,
  notice:'Presence of model-scoped supplier content is not independent certification. Generic supplier policies cannot establish tenant agreements, residency, retention, enabled controls or model-level deployment terms.'
 };
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href) {
 const catalogPath='data/ai-model-catalog-v1.json';
 const catalog=JSON.parse(await fs.readFile(catalogPath,'utf8'));
 if(process.argv[2]==='--check'||process.argv[2]==='--reconcile') {
  const apply=process.argv[2]==='--reconcile';
  const report=reconcileSupplierAudit(catalog,{apply});
  if(apply&&report.changed_models) {
   const temporary=catalogPath+'.reconcile-'+process.pid+'.tmp';
   await fs.writeFile(temporary,JSON.stringify(catalog,null,2)+'\n','utf8');
   await fs.rename(temporary,catalogPath);
  }
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(!apply&&report.changed_models) process.exitCode=2;
 } else {
  const output=JSON.stringify(supplierEvidenceWorklist(catalog),null,2)+'\n';
  if(process.argv[2]) await fs.writeFile(process.argv[2],output);
  else process.stdout.write(output);
 }
}
