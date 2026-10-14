import test from 'node:test';
import assert from 'node:assert/strict';
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
