import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI model catalog recovery is evidence-scoped and avoids false verification', () => {
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 assert.equal(c.models.length,110);
 assert.equal(new Set(c.models.map(m=>m.id)).size,c.models.length);
 for(const m of c.models){
  assert.match(m.source,/^https:\/\//);
  assert.ok(m.verified_at);
 }
 const astra=c.models.find(m=>m.id==='gpt-6-astra');
 assert.equal(astra.input_usd_m,10);
 assert.equal(astra.output_usd_m,50);
 assert.equal(astra.cached_input_usd_m,1);
 const governance=astra.verification_evidence?.claim_evidence?.filter(r=>r.claim==='governance')||[];
 const providerOnly=governance.every(r=>r.verification_status==='PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED'||
  String(r.scope??'').includes('NOT model-specific'));
 if(providerOnly){
  assert.notEqual(astra.verification_evidence?.claim_scope,'full','Provider policy alone cannot certify full model governance');
  assert.equal(astra.supplier_audit?.claim_evidence_classification?.governance,'PROVIDER_POLICY_ONLY');
 }
 assert.ok(c.models.some(m=>m.verified_at==='2026-09-30'),'Do not restamp unverified models');
});

test('catalog audit requires byte-equivalent semantic production readback when release URL is set',()=>{
 const audit=fs.readFileSync('tests/ai-model-catalog-evidence-audit.mjs','utf8');
 assert.match(audit,/MODEL_CATALOG_PRODUCTION_URL/);
 assert.match(audit,/MODEL_CATALOG_REQUIRE_PRODUCTION_READBACK/);
 assert.match(audit,/PRODUCTION_URL_REQUIRED/);
 assert.match(audit,/CATALOG_CONTENT_MISMATCH/);
 assert.match(audit,/production_readback\.status = 'MATCH'/);
 assert.match(audit,/createHash\('sha256'\)/);
 assert.match(audit,/process\.exitCode = 2/);
});

test('model advisor rejects EOL and family placeholders even when active-only filter is off',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 assert.match(html,/m\.status==='eol'\|\|m\.auto_recommendation_eligible===false\|\|m\.record_kind==='model_family_placeholder'/);
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const m of catalog.models.filter(x=>x.status==='eol'||x.record_kind==='model_family_placeholder'))
   assert.notEqual(m.auto_recommendation_eligible,true);
});

test('supplier source classifications remain fail-closed across all model records',async()=>{
 const { classifySupplierClaim, REQUIRED_SUPPLIER_CLAIMS }=await import('./ai-model-supplier-evidence-worklist.mjs');
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const types={MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED:'MODEL_SOURCE_RECEIPT_REVIEW_REQUIRED',
 PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF:'PROVIDER_POLICY_ONLY',
 NO_USABLE_MODEL_SOURCE_RECEIPT:'MISSING_OR_INCOMPLETE'};
 let count=0;
 for(const m of c.models){
  const pending=[];
  for(const claim of REQUIRED_SUPPLIER_CLAIMS){
   const observed=classifySupplierClaim(m.verification_evidence,claim);
   assert.equal(m.supplier_audit?.claim_evidence_classification?.[claim],types[observed],m.id+'/'+claim);
   if(observed!=='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED')pending.push(claim);
   count++;
  }
  assert.deepEqual(m.supplier_audit.missing_claim_receipts,pending,m.id+' evidence needs reconciliation');
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 }
 assert.equal(count,660);
});
