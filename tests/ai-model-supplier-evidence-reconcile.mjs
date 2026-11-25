// Deterministic supplier-evidence bookkeeping repair. Never creates receipts or supplier approval.
import {classifySupplierClaim,REQUIRED_SUPPLIER_CLAIMS} from './ai-model-supplier-evidence-worklist.mjs';

/**
 * Reconcile source-backed claim classifications and catalog audit summaries.
 * No dates, observed values, source URLs or customer agreements are changed.
 * Anything that is only a provider-wide baseline remains pending.
 * This function does not independently verify supplier claims.
 */
export function reconcileSupplierEvidenceCatalog(catalog){
 if(!catalog||!Array.isArray(catalog.models))throw new TypeError('INVALID_MODEL_CATALOG');
 const next=structuredClone(catalog),changed=[],removedApprovals=[];
 for(const m of next.models){
  const e=m.verification_evidence||{};
  const a=m.supplier_audit||{};
  m.verification_evidence=e;
  m.supplier_audit=a;
  const before=JSON.stringify({e,a});
  const classifications=Object.fromEntries(REQUIRED_SUPPLIER_CLAIMS.map(cl=>[cl,classifySupplierClaim(e,cl)]));
  const verified=new Set(Array.isArray(e.verified_claims)?e.verified_claims:[]);
  const unresolved=new Set(Array.isArray(e.not_verified)?e.not_verified:[]);
  for(const cl of REQUIRED_SUPPLIER_CLAIMS){
   if(classifications[cl]!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED'&&verified.has(cl)){
    verified.delete(cl);
    removedApprovals.push({model_id:m.id,claim:cl,reason:classifications[cl]});
   }
   if(verified.has(cl))unresolved.delete(cl);
   else unresolved.add(cl);
  }
  e.verified_claims=[...(Array.isArray(e.verified_claims)?e.verified_claims:[]).filter(cl=>verified.has(cl))];
  e.not_verified=[...unresolved];
  if(REQUIRED_SUPPLIER_CLAIMS.some(cl=>!verified.has(cl))){
   if(e.claim_scope==='full')e.claim_scope='partial';
   if(e.evidence_status==='FULLY_VERIFIED')e.evidence_status='PARTIALLY_VERIFIED';
  }
  const missing=REQUIRED_SUPPLIER_CLAIMS.filter(cl=>classifications[cl]!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED');
  const review=REQUIRED_SUPPLIER_CLAIMS.filter(cl=>!(
   classifications[cl]==='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED'&&
   e.claim_scope==='full'&&e.source_url===m.source&&e.checked_on===m.verified_at&&
   verified.has(cl)&&!unresolved.has(cl)
  ));
  a.claim_evidence_classification=classifications;
  a.missing_claim_receipts=missing;
  a.missing_receipt_count=missing.length;
  a.review_required_claims=review;
  a.pending_independent_claim_reviews=review.length;
  // A receipt being inspectable is not independent third-party acceptance.
  a.automatic_recommendation_eligible=false;
  a.independent_verification_required=true;
  if(before!==JSON.stringify({e,a}))changed.push(m.id);
 }
 return {catalog:next,report:{models:next.models.length,changed_models:changed,
  removed_unsupported_approvals:removedApprovals,
  note:'Structural reconciliation only. It neither creates supplier evidence nor certifies independent verification.'}};
}
