import test from 'node:test';
import assert from 'node:assert/strict';
import {customerClaimStatus,customerReady} from './ai-model-customer-governance-evidence.mjs';
const date=new Date('2026-10-14T12:00:00Z');
const base={tenantId:'customer-a',provider:'OpenAI',modelId:'gpt-6-astra',asOf:date};
const common={tenant_id:'customer-a',provider:'OpenAI',model_id:'gpt-6-astra',
 scope:'customer_specific',review_status:'approved',approved_by:'legal-and-security',
 evidence_reference:'restricted://contracts/customer-a/evidence-id',
 checked_on:'2026-10-13',valid_until:'2026-12-31'};
test('public supplier documentation is never customer agreement evidence',()=>{
 const receipt={...common,claim:'signed_dpa',evidence_kind:'supplier_website'};
 assert.equal(customerClaimStatus({...base,claim:'signed_dpa',receipts:[receipt]}).status,'UNVERIFIED');
});
test('signed agreement must be approved, tenant-bound and unexpired',()=>{
 const receipt={...common,claim:'signed_dpa',evidence_kind:'signed_agreement'};
 assert.equal(customerClaimStatus({...base,claim:'signed_dpa',receipts:[receipt]}).status,'VERIFIED');
 assert.equal(customerClaimStatus({...base,claim:'signed_dpa',receipts:[{...receipt,tenant_id:'other-tenant'}]}).status,'UNVERIFIED');
 assert.equal(customerClaimStatus({...base,claim:'signed_dpa',receipts:[{...receipt,valid_until:'2026-10-01'}]}).status,'UNVERIFIED');
});
test('regional promises need contractual and verified runtime location',()=>{
 const receipt={...common,claim:'tenant_data_residency',evidence_kind:'contract_and_runtime',region:'eu-west-1'};
 assert.equal(customerClaimStatus({...base,claim:'tenant_data_residency',receipts:[receipt]}).status,'UNVERIFIED');
 assert.equal(customerClaimStatus({...base,claim:'tenant_data_residency',receipts:[{...receipt,runtime_region_confirmed:true}]}).status,'VERIFIED');
});
test('zero retention and security controls must be enabled and evidenced',()=>{
 const receipt={...common,claim:'tenant_zdr',evidence_kind:'enabled_control',control_enabled:false,configuration_reference:'restricted://config/zdr'};
 assert.equal(customerClaimStatus({...base,claim:'tenant_zdr',receipts:[receipt]}).status,'UNVERIFIED');
 assert.equal(customerClaimStatus({...base,claim:'tenant_zdr',receipts:[{...receipt,control_enabled:true}]}).status,'VERIFIED');
});
test('whole customer approval remains blocked without all receipts',()=>{
 assert.equal(customerReady({...base,receipts:[]}).ready,false);
});

test('approval remains valid through the whole expiry calendar day',()=>{
 const receipt={...common,claim:'signed_dpa',evidence_kind:'signed_agreement',valid_until:'2026-10-14'};
 assert.equal(customerClaimStatus({...base,claim:'signed_dpa',receipts:[receipt],asOf:new Date('2026-10-14T23:30:00Z')}).status,'VERIFIED');
 assert.equal(customerClaimStatus({...base,claim:'signed_dpa',receipts:[receipt],asOf:new Date('2026-10-15T00:00:00Z')}).status,'UNVERIFIED');
});
test('missing or malformed evidence receipts fail closed',()=>{
 assert.equal(customerClaimStatus({...base,claim:'contract',receipts:null}).status,'UNVERIFIED');
 assert.equal(customerClaimStatus({...base,claim:'contract',receipts:{claim:'contract'}}).status,'UNVERIFIED');
});



import {supplierEvidenceWorklist} from './ai-model-supplier-evidence-worklist.mjs';
const source='https://supplier.example/models/m1';
const minimal={version:1,models:[{id:'m1',provider:'Supplier',source,verified_at:'2026-10-14'}]};
test('missing receipts remain pending and do not rewrite catalog',()=>{
 const before=JSON.stringify(minimal),r=supplierEvidenceWorklist(minimal);
 assert.equal(r.pending_claim_reviews,6);
 assert.equal(r.ready_for_full_supplier_acceptance,false);
 assert.equal(JSON.stringify(minimal),before);
 assert.ok(r.worklist.every(x=>x.official_source===source));
});
test('generic receipt without observed value is not accepted',()=>{
 const catalog={version:1,models:[{...minimal.models[0],verification_evidence:{
  claim_scope:'full',source_url:source,checked_on:'2026-10-14',verified_claims:['model_id'],not_verified:[],
  claim_evidence:[{claim:'model_id',url:source,locator:'Models',checked_on:'2026-10-14'}]
 }}]};
 const result=supplierEvidenceWorklist(catalog);
 assert.equal(result.pending_claim_reviews,6);
});

// Reconciliation must not silently turn provider-wide governance into per-model approval.
test('supplier evidence reconciliation retracts only unsupported approvals',async()=>{
 const {reconcileSupplierEvidenceCatalog}=await import('./ai-model-supplier-evidence-reconcile.mjs');
 const baseline={version:'test',models:[{id:'m1',source:'https://vendor.example/models/m1',verified_at:'2026-10-14',
  verification_evidence:{claim_scope:'full',evidence_status:'FULLY_VERIFIED',source_url:'https://vendor.example/models/m1',checked_on:'2026-10-14',
   verified_claims:['model_id','status','pricing','capabilities','deployment','governance'],not_verified:[],
   claim_evidence:['model_id','status','pricing','capabilities','deployment'].map(cl=>({claim:cl,url:'https://vendor.example/models/m1',locator:cl,observed_value:'documented '+cl,checked_on:'2026-10-14'})).concat([{claim:'governance',url:'https://vendor.example/policy',locator:'Provider policy',observed_value:'Generic provider rules',checked_on:'2026-10-14',scope:'NOT model-specific or tenant attestation',verification_status:'PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED'}])},supplier_audit:{automatic_recommendation_eligible:true}}]};
 const before=JSON.stringify(baseline),{catalog,report}=reconcileSupplierEvidenceCatalog(baseline),m=catalog.models[0];
 assert.equal(JSON.stringify(baseline),before,'input is not changed');
 assert.equal(m.verified_at,'2026-10-14');
 assert.equal(m.verification_evidence.checked_on,'2026-10-14');
 assert.deepEqual(m.verification_evidence.claim_evidence,baseline.models[0].verification_evidence.claim_evidence);
 assert.ok(m.verification_evidence.not_verified.includes('governance'));
 assert.ok(!m.verification_evidence.verified_claims.includes('governance'));
 assert.equal(m.verification_evidence.claim_scope,'partial');
 assert.deepEqual(m.supplier_audit.missing_claim_receipts,['governance']);
 assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 assert.deepEqual(report.removed_unsupported_approvals,[{model_id:'m1',claim:'governance',reason:'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF'}]);
 assert.deepEqual(reconcileSupplierEvidenceCatalog(catalog).catalog,catalog,'idempotent');
});

test('incomplete supplier pricing remains unverified after reconciliation',async()=>{
 const {reconcileSupplierEvidenceCatalog}=await import('./ai-model-supplier-evidence-reconcile.mjs');
 const cat={models:[{id:'embed-test',source:'https://vendor.example/embed',verified_at:'2026-10-14',verification_evidence:{
  claim_scope:'partial',checked_on:'2026-10-14',verified_claims:['model_id'],not_verified:['governance'],
  claim_evidence:[{claim:'pricing',url:'https://vendor.example/pricing',locator:'Per token',observed_value:'Basis only',checked_on:'2026-10-14',verification_status:'PRICING_BASIS_ONLY_CURRENT_RATE_UNKNOWN'}]}}]};
 const m=reconcileSupplierEvidenceCatalog(cat).catalog.models[0];
 assert.ok(m.verification_evidence.not_verified.includes('pricing'));
 assert.equal(m.supplier_audit.claim_evidence_classification.pricing,'NO_USABLE_MODEL_SOURCE_RECEIPT');
 assert.equal(m.supplier_audit.pending_independent_claim_reviews,6);
});
