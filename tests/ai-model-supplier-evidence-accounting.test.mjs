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
 assert.equal(r.ready_for_full_supplier_acceptance,r.pending_claim_reviews===0);
 for(const row of r.worklist)
  assert.ok(['MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED','PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF',
   'NO_USABLE_MODEL_SOURCE_RECEIPT'].includes(row.evidence_classification));
});
