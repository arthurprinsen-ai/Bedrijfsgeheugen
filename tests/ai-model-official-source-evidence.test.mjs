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
   assert.ok(['OFFICIAL_PAGE_MODEL_ID_MENTION','OFFICIAL_PAGE_NO_EXACT_MODEL_ID'].includes(receipt.status),
    `unresolved source audit state for ${m.id}: ${receipt.status}`);
   assert.equal(receipt.full_model_verification_granted,false);
   assert.equal(receipt.customer_dpa_verified,false);
   assert.equal(receipt.customer_runtime_residency_verified,false);
   if(receipt.identity_claim_verified){
     assert.equal(receipt.status,'OFFICIAL_PAGE_MODEL_ID_MENTION');
     assert.ok(receipt.evidence_excerpt?.toLowerCase().includes(m.id.toLowerCase()),
       `no exact model ID in source excerpt: ${m.id}`);
   }else{
     assert.equal(receipt.status,'OFFICIAL_PAGE_NO_EXACT_MODEL_ID');
   }
 }
});

test('source reachability and mention are not misreported as full model or tenant verification',()=>{
 const mentions=evidence.receipts.filter(r=>r.identity_claim_verified).length;
 assert.equal(evidence.model_id_mentions,mentions);
 assert.equal(evidence.model_id_not_explicit,catalog.models.length-mentions);
 assert.equal(evidence.whole_model_verifications_added,0);
 assert.ok(catalog.models.every(m=>!m.claim_evidence?.tenant_governance
   ||m.claim_evidence.tenant_governance.status==='UNVERIFIED_REQUIRES_CUSTOMER_READBACK'));
 assert.ok(catalog.models.every(m=>!m.claim_evidence?.provider_contracts
   ||m.claim_evidence.provider_contracts.status==='UNVERIFIED_REQUIRES_AUTHORIZED_CONTRACT'));
});
