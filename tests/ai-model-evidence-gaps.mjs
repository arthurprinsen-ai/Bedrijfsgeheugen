#!/usr/bin/env node
// Read-only evidence triage: a receipt is not an independent verification or a tenant attestation.
import fs from 'node:fs';
import { supplierEvidenceWorklist, classifySupplierClaim, REQUIRED_SUPPLIER_CLAIMS } from './ai-model-supplier-evidence-worklist.mjs';

const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const review=supplierEvidenceWorklist(catalog);
const rows=catalog.models.map(model=>{
 const e=model.verification_evidence||{};
 const byClaim=Object.fromEntries(REQUIRED_SUPPLIER_CLAIMS.map(claim=>[claim,classifySupplierClaim(e,claim)]));
 const pending=REQUIRED_SUPPLIER_CLAIMS.filter(claim=>byClaim[claim]!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED');
 return {model_id:model.id,provider:model.provider,claim_scope:e.claim_scope??'none',
  automatic_recommendation_eligible:false,claim_evidence_classification:byClaim,
  claims_without_model_scoped_source:pending,
  full_independent_verification_complete:false};
});
const classifications=review.evidence_classification;
const totals={model_records:catalog.models.length,required_claims_per_model:REQUIRED_SUPPLIER_CLAIMS.length,
 total_claims:review.total_claims,
 model_source_receipts_for_independent_review:classifications.model_scoped_receipts,
 provider_policy_only_not_model_proof:classifications.provider_baseline_only,
 no_usable_model_source:classifications.missing_or_incomplete_receipts,
 still_lacking_model_scoped_source:classifications.provider_baseline_only+classifications.missing_or_incomplete_receipts,
 claims_not_structurally_declared_full:review.pending_claim_reviews,
 declared_full_scope_models:review.fully_verified_models};
if(totals.model_source_receipts_for_independent_review+totals.still_lacking_model_scoped_source!==totals.total_claims)
 throw new Error('EVIDENCE_CLASSIFICATION_TOTAL_MISMATCH');
if(rows.length!==110)throw new Error('MODEL_COUNT_MISMATCH');
console.log(JSON.stringify({summary:totals,note:'A dated model source receipt is only a review candidate. General supplier policies never attest to a specific model or customer. CI and production acceptance remain blocked until independently verified.',models:rows},null,2));
