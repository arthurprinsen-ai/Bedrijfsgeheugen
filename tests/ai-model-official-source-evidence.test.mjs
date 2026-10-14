import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync('data/ai-model-catalog-v1.json','utf8'));
const evidence=JSON.parse(readFileSync('data/evidence/ai-model-official-sources-2026-10-14.json','utf8'));

test('110 model identities each have a matching official source audit receipt',()=>{
 assert.equal(catalog.models.length,110);
 assert.equal(evidence.receipts.length,catalog.models.length);
 const indexed=new Map(evidence.receipts.map(r=>[r.model_id,r]));
 assert.equal(indexed.size,catalog.models.length,'duplicate or missing model identity receipts');
 const checkedUrls=new Set(catalog.models.map(m=>m.source));
 assert.equal(evidence.source_urls_checked,checkedUrls.size);
 assert.equal(evidence.source_urls_retrieved,checkedUrls.size);
 for(const m of catalog.models){
   const receipt=indexed.get(m.id);
   assert.ok(receipt,`missing audit receipt for ${m.id}`);
   assert.equal(receipt.source_url,m.source,`source URL drift for ${m.id}`);
   assert.ok(/^https:\/\//.test(receipt.source_url));
   assert.equal(receipt.checked_at,'2026-10-14');
   assert.equal(evidence.source_checks[m.source]?.state,'FETCHED',`source not fetched for ${m.id}`);
   assert.ok(['OFFICIAL_PAGE_MODEL_ID_MENTION','OFFICIAL_PAGE_API_ID_MENTION','PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID'].includes(receipt.status),
    `unresolved source audit state for ${m.id}: ${receipt.status}`);
   assert.equal(receipt.full_model_verification_granted,false);
   assert.equal(receipt.customer_dpa_verified,false);
   assert.equal(receipt.customer_runtime_residency_verified,false);
   if(receipt.identity_claim_verified){
     assert.ok(['OFFICIAL_PAGE_MODEL_ID_MENTION','OFFICIAL_PAGE_API_ID_MENTION'].includes(receipt.status));
     const identity=receipt.status==='OFFICIAL_PAGE_API_ID_MENTION'?receipt.provider_api_id:m.id;
     assert.ok(identity && receipt.evidence_excerpt?.toLowerCase().includes(identity.toLowerCase()),
       `no verified model/API ID in source excerpt: ${m.id}`);
     if(receipt.status==='OFFICIAL_PAGE_API_ID_MENTION'){
       assert.equal(receipt.provider_api_id,m.provider_model_id);
       assert.equal(receipt.provider_api_id_mentioned_in_document,true);
     }
   }else{
     assert.equal(receipt.status,'PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID');
     assert.equal(m.record_kind,'model_family');
     assert.equal(m.selection_eligible,false);
   }
 }
});

test('source reachability and mention are not misreported as full model or tenant verification',()=>{
 const mentions=evidence.receipts.filter(r=>r.identity_claim_verified).length;
 assert.equal(evidence.model_id_mentions,evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_MODEL_ID_MENTION').length);
 assert.equal(evidence.provider_api_id_mentions,evidence.receipts.filter(r=>r.status==='OFFICIAL_PAGE_API_ID_MENTION').length);
 const familyReferences=evidence.receipts.filter(r=>r.status==='PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID').length;
 const unresolved=evidence.receipts.filter(r=>!r.identity_claim_verified
   && r.status!=='PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID').length;
 assert.equal(evidence.model_id_not_explicit,unresolved,'Do not count intentional families as unidentified models');
 assert.equal(evidence.non_deployable_family_references,familyReferences);
 assert.equal(mentions+familyReferences+unresolved,catalog.models.length);
 assert.equal(evidence.whole_model_verifications_added,0);
 assert.ok(catalog.models.every(m=>!m.claim_evidence?.tenant_governance
   ||['UNVERIFIED_REQUIRES_CUSTOMER_READBACK','SELF_HOST_DEPLOYMENT_SPECIFIC'].includes(m.claim_evidence.tenant_governance.status)));
 assert.ok(catalog.models.every(m=>!m.claim_evidence?.provider_contracts
   ||['UNVERIFIED_REQUIRES_AUTHORIZED_CONTRACT','HOSTING_PROVIDER_DEPENDENT','DEPLOYMENT_SPECIFIC'].includes(m.claim_evidence.provider_contracts.status)));
});
