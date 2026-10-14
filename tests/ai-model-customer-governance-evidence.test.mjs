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
