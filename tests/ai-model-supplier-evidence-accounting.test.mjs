import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifySupplierClaim,supplierEvidenceWorklist} from './ai-model-supplier-evidence-worklist.mjs';

const date='2026-10-14';
const modelReceipt={
 claim:'governance',url:'https://provider.example/model',
 locator:'Model specific > retention',observed_value:'Documented model-specific retention term',
 checked_on:date
};
const policyReceipt={
 ...modelReceipt,
 url:'https://provider.example/terms',
 scope:'official provider/API baseline only; NOT model-specific deployed tenant or executed customer contract evidence',
 verification_status:'PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED'
};

test('generic supplier policy never counts as model-specific evidence',()=>{
 assert.equal(classifySupplierClaim({checked_on:date,claim_evidence:[policyReceipt]},'governance'),
  'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF');
 assert.equal(classifySupplierClaim({checked_on:date,claim_evidence:[{...modelReceipt,observed_value:''}]},'governance'),
  'NO_USABLE_MODEL_SOURCE_RECEIPT');
 assert.equal(classifySupplierClaim({checked_on:date,claim_evidence:[modelReceipt]},'governance'),
  'MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED');
});

test('110-model worklist categories exactly partition six claims per model',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const r=supplierEvidenceWorklist(c);
 assert.equal(r.models,110);
 assert.equal(r.total_claims,660);
 const classified=Object.values(r.evidence_classification).reduce((a,b)=>a+b,0);
 assert.equal(classified,r.total_claims);
 assert.equal(r.missing_claim_specific_receipts,
  r.evidence_classification.provider_baseline_only+r.evidence_classification.missing_or_incomplete_receipts);
 assert.equal(r.existing_complete_receipts+r.missing_claim_specific_receipts,r.total_claims);
 assert.equal(r.pending_claim_reviews,r.worklist.length);
 assert.equal(r.structurally_complete_models>=r.independently_accepted_models,true);
 assert.equal(r.fully_verified_models,r.independently_accepted_models);
 assert.equal(r.pending_independent_model_reviews,r.models-r.independently_accepted_models);
 const independentlyApproved=c.models.filter(m=>m.supplier_audit?.independent_verification_required===false&&
   m.supplier_audit?.automatic_recommendation_eligible===true&&m.verification_evidence?.claim_scope==='full');
 assert.equal(r.independently_accepted_models,independentlyApproved.length);
 assert.equal(r.ready_for_full_supplier_acceptance,
   r.pending_claim_reviews===0&&r.pending_independent_model_reviews===0);
 // A complete supplier receipt does not automatically confer independent acceptance.
 assert.ok(c.models.some(m=>m.verification_evidence?.claim_scope==='full'&&
   m.supplier_audit?.independent_verification_required===true));
 for(const row of r.worklist)
  assert.ok(['MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED','PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF',
   'NO_USABLE_MODEL_SOURCE_RECEIPT'].includes(row.evidence_classification));
});

test('public model advisor must never promote provider-only policy to full model governance',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 const source=html.slice(html.indexOf('function fullSupplierEvidence(m)'),html.indexOf('function eligible(m)'));
 assert.match(source,/PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED/);
 assert.match(source,/NOT model-specific/);
});
